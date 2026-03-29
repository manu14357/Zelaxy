import crypto from 'crypto'
import { and, eq, isNull } from 'drizzle-orm'
import { processDocument } from '@/lib/documents/document-processor'
import { retryWithExponentialBackoff } from '@/lib/documents/utils'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { db } from '@/db'
import { document, embedding, knowledgeBase } from '@/db/schema'

const logger = createLogger('KnowledgeUtils')

// Timeout constants (in milliseconds)
const TIMEOUTS = {
  OVERALL_PROCESSING: 150000, // 150 seconds (2.5 minutes)
  EMBEDDINGS_API: 60000, // 60 seconds per batch
} as const

class APIError extends Error {
  public status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'APIError'
    this.status = status
  }
}

/**
 * Create a timeout wrapper for async operations
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation = 'Operation'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ])
}

export interface KnowledgeBaseData {
  id: string
  userId: string
  workspaceId?: string | null
  name: string
  description?: string | null
  tokenCount: number
  embeddingModel: string
  embeddingDimension: number
  chunkingConfig: unknown
  deletedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface DocumentData {
  id: string
  knowledgeBaseId: string
  filename: string
  fileUrl: string
  fileSize: number
  mimeType: string
  chunkCount: number
  tokenCount: number
  characterCount: number
  processingStatus: string
  processingStartedAt?: Date | null
  processingCompletedAt?: Date | null
  processingError?: string | null
  enabled: boolean
  deletedAt?: Date | null
  uploadedAt: Date
  // Document tags
  tag1?: string | null
  tag2?: string | null
  tag3?: string | null
  tag4?: string | null
  tag5?: string | null
  tag6?: string | null
  tag7?: string | null
}

export interface EmbeddingData {
  id: string
  knowledgeBaseId: string
  documentId: string
  chunkIndex: number
  chunkHash: string
  content: string
  contentLength: number
  tokenCount: number
  embedding?: number[] | null
  embeddingModel: string
  startOffset: number
  endOffset: number
  // Tag fields for filtering
  tag1?: string | null
  tag2?: string | null
  tag3?: string | null
  tag4?: string | null
  tag5?: string | null
  tag6?: string | null
  tag7?: string | null
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

interface OpenAIEmbeddingResponse {
  data: Array<{
    embedding: number[]
    index: number
  }>
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

export interface KnowledgeBaseAccessResult {
  hasAccess: true
  knowledgeBase: Pick<KnowledgeBaseData, 'id' | 'userId'>
}

export interface KnowledgeBaseAccessDenied {
  hasAccess: false
  notFound?: boolean
  reason?: string
}

export type KnowledgeBaseAccessCheck = KnowledgeBaseAccessResult | KnowledgeBaseAccessDenied

export interface DocumentAccessResult {
  hasAccess: true
  document: DocumentData
  knowledgeBase: Pick<KnowledgeBaseData, 'id' | 'userId'>
}

export interface DocumentAccessDenied {
  hasAccess: false
  notFound?: boolean
  reason: string
}

export type DocumentAccessCheck = DocumentAccessResult | DocumentAccessDenied

export interface ChunkAccessResult {
  hasAccess: true
  chunk: EmbeddingData
  document: DocumentData
  knowledgeBase: Pick<KnowledgeBaseData, 'id' | 'userId'>
}

export interface ChunkAccessDenied {
  hasAccess: false
  notFound?: boolean
  reason: string
}

export type ChunkAccessCheck = ChunkAccessResult | ChunkAccessDenied

/**
 * Check if a user has access to a knowledge base
 */
export async function checkKnowledgeBaseAccess(
  knowledgeBaseId: string,
  userId: string
): Promise<KnowledgeBaseAccessCheck> {
  const kb = await db
    .select({
      id: knowledgeBase.id,
      userId: knowledgeBase.userId,
      workspaceId: knowledgeBase.workspaceId,
    })
    .from(knowledgeBase)
    .where(and(eq(knowledgeBase.id, knowledgeBaseId), isNull(knowledgeBase.deletedAt)))
    .limit(1)

  if (kb.length === 0) {
    return { hasAccess: false, notFound: true }
  }

  const kbData = kb[0]

  // Case 1: User owns the knowledge base directly
  if (kbData.userId === userId) {
    return { hasAccess: true, knowledgeBase: kbData }
  }

  // Case 2: Knowledge base belongs to a workspace the user has permissions for
  if (kbData.workspaceId) {
    const userPermission = await getUserEntityPermissions(userId, 'workspace', kbData.workspaceId)
    if (userPermission !== null) {
      return { hasAccess: true, knowledgeBase: kbData }
    }
  }

  return { hasAccess: false }
}

/**
 * Check if a user has write access to a knowledge base
 * Write access is granted if:
 * 1. User owns the knowledge base directly, OR
 * 2. User has write or admin permissions on the knowledge base's workspace
 */
export async function checkKnowledgeBaseWriteAccess(
  knowledgeBaseId: string,
  userId: string
): Promise<KnowledgeBaseAccessCheck> {
  const kb = await db
    .select({
      id: knowledgeBase.id,
      userId: knowledgeBase.userId,
      workspaceId: knowledgeBase.workspaceId,
    })
    .from(knowledgeBase)
    .where(and(eq(knowledgeBase.id, knowledgeBaseId), isNull(knowledgeBase.deletedAt)))
    .limit(1)

  if (kb.length === 0) {
    return { hasAccess: false, notFound: true }
  }

  const kbData = kb[0]

  // Case 1: User owns the knowledge base directly
  if (kbData.userId === userId) {
    return { hasAccess: true, knowledgeBase: kbData }
  }

  // Case 2: Knowledge base belongs to a workspace and user has write/admin permissions
  if (kbData.workspaceId) {
    const userPermission = await getUserEntityPermissions(userId, 'workspace', kbData.workspaceId)
    if (userPermission === 'write' || userPermission === 'admin') {
      return { hasAccess: true, knowledgeBase: kbData }
    }
  }

  return { hasAccess: false }
}

/**
 * Check if a user has write access to a specific document
 * Write access is granted if user has write access to the knowledge base
 */
export async function checkDocumentWriteAccess(
  knowledgeBaseId: string,
  documentId: string,
  userId: string
): Promise<DocumentAccessCheck> {
  // First check if user has write access to the knowledge base
  const kbAccess = await checkKnowledgeBaseWriteAccess(knowledgeBaseId, userId)

  if (!kbAccess.hasAccess) {
    return {
      hasAccess: false,
      notFound: kbAccess.notFound,
      reason: kbAccess.notFound ? 'Knowledge base not found' : 'Unauthorized knowledge base access',
    }
  }

  // Check if document exists
  const doc = await db
    .select({
      id: document.id,
      filename: document.filename,
      fileUrl: document.fileUrl,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      chunkCount: document.chunkCount,
      tokenCount: document.tokenCount,
      characterCount: document.characterCount,
      enabled: document.enabled,
      processingStatus: document.processingStatus,
      processingError: document.processingError,
      uploadedAt: document.uploadedAt,
      processingStartedAt: document.processingStartedAt,
      processingCompletedAt: document.processingCompletedAt,
      knowledgeBaseId: document.knowledgeBaseId,
    })
    .from(document)
    .where(and(eq(document.id, documentId), isNull(document.deletedAt)))
    .limit(1)

  if (doc.length === 0) {
    return { hasAccess: false, notFound: true, reason: 'Document not found' }
  }

  return {
    hasAccess: true,
    document: doc[0] as DocumentData,
    knowledgeBase: kbAccess.knowledgeBase!,
  }
}

/**
 * Check if a user has access to a document within a knowledge base
 */
export async function checkDocumentAccess(
  knowledgeBaseId: string,
  documentId: string,
  userId: string
): Promise<DocumentAccessCheck> {
  // First check if user has access to the knowledge base
  const kbAccess = await checkKnowledgeBaseAccess(knowledgeBaseId, userId)

  if (!kbAccess.hasAccess) {
    return {
      hasAccess: false,
      notFound: kbAccess.notFound,
      reason: kbAccess.notFound ? 'Knowledge base not found' : 'Unauthorized knowledge base access',
    }
  }

  const doc = await db
    .select()
    .from(document)
    .where(
      and(
        eq(document.id, documentId),
        eq(document.knowledgeBaseId, knowledgeBaseId),
        isNull(document.deletedAt)
      )
    )
    .limit(1)

  if (doc.length === 0) {
    return { hasAccess: false, notFound: true, reason: 'Document not found' }
  }

  return {
    hasAccess: true,
    document: doc[0] as DocumentData,
    knowledgeBase: kbAccess.knowledgeBase!,
  }
}

/**
 * Check if a user has access to a chunk within a document and knowledge base
 */
export async function checkChunkAccess(
  knowledgeBaseId: string,
  documentId: string,
  chunkId: string,
  userId: string
): Promise<ChunkAccessCheck> {
  // First check if user has access to the knowledge base
  const kbAccess = await checkKnowledgeBaseAccess(knowledgeBaseId, userId)

  if (!kbAccess.hasAccess) {
    return {
      hasAccess: false,
      notFound: kbAccess.notFound,
      reason: kbAccess.notFound ? 'Knowledge base not found' : 'Unauthorized knowledge base access',
    }
  }

  const doc = await db
    .select()
    .from(document)
    .where(
      and(
        eq(document.id, documentId),
        eq(document.knowledgeBaseId, knowledgeBaseId),
        isNull(document.deletedAt)
      )
    )
    .limit(1)

  if (doc.length === 0) {
    return { hasAccess: false, notFound: true, reason: 'Document not found' }
  }

  const docData = doc[0] as DocumentData

  // Check if document processing is completed
  if (docData.processingStatus !== 'completed') {
    return {
      hasAccess: false,
      reason: `Document is not ready for access (status: ${docData.processingStatus})`,
    }
  }

  const chunk = await db
    .select()
    .from(embedding)
    .where(and(eq(embedding.id, chunkId), eq(embedding.documentId, documentId)))
    .limit(1)

  if (chunk.length === 0) {
    return { hasAccess: false, notFound: true, reason: 'Chunk not found' }
  }

  return {
    hasAccess: true,
    chunk: chunk[0] as EmbeddingData,
    document: docData,
    knowledgeBase: kbAccess.knowledgeBase!,
  }
}

/**
 * Generate embeddings using Ollama API
 */
async function generateOllamaEmbeddings(
  texts: string[],
  embeddingModel: string
): Promise<number[][]> {
  const ollamaUrl = env.OLLAMA_URL || 'http://localhost:11434'

  logger.info(`Generating embeddings using Ollama model: ${embeddingModel}`)

  try {
    const allEmbeddings: number[][] = []

    // Process texts one by one for Ollama (it's typically faster for local processing)
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i]
      logger.info(`Generating embedding ${i + 1}/${texts.length}`)

      const embedding = await retryWithExponentialBackoff(
        async () => {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.EMBEDDINGS_API)

          try {
            const response = await fetch(`${ollamaUrl}/api/embeddings`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: embeddingModel,
                prompt: text,
              }),
              signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
              const errorText = await response.text()
              throw new Error(
                `Ollama API error: ${response.status} ${response.statusText} - ${errorText}`
              )
            }

            const data = await response.json()

            if (!data.embedding || !Array.isArray(data.embedding)) {
              throw new Error('Invalid response format from Ollama embeddings API')
            }

            return data.embedding
          } catch (error) {
            clearTimeout(timeoutId)
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error('Ollama API request timed out')
            }
            throw error
          }
        },
        {
          maxRetries: 3,
          initialDelayMs: 500,
          maxDelayMs: 5000,
          backoffMultiplier: 2,
        }
      )

      allEmbeddings.push(embedding)
    }

    logger.info(`Successfully generated ${allEmbeddings.length} embeddings using Ollama`)
    return allEmbeddings
  } catch (error) {
    logger.error('Failed to generate embeddings with Ollama:', error)
    throw new Error(
      `Ollama embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate embeddings using the appropriate provider based on model name
 */
export async function generateEmbeddings(
  texts: string[],
  embeddingModel?: string,
  apiKeys?: Record<string, string>
): Promise<number[][]> {
  // Determine the embedding model to use
  if (!embeddingModel) {
    // Default to Ollama if available, otherwise OpenAI
    if (env.OLLAMA_URL || env.DEFAULT_EMBEDDING_MODEL?.includes('nomic')) {
      embeddingModel = env.DEFAULT_EMBEDDING_MODEL || 'nomic-embed-text'
    } else {
      embeddingModel = 'text-embedding-3-small'
    }
  }

  // Determine provider and handle accordingly
  const provider = getProviderFromModel(embeddingModel)

  switch (provider) {
    case 'ollama':
      return generateOllamaEmbeddings(texts, embeddingModel)

    case 'openai':
      return generateOpenAIEmbeddings(texts, embeddingModel, apiKeys?.openai)

    case 'anthropic':
      return generateAnthropicEmbeddings(texts, embeddingModel, apiKeys?.anthropic)

    case 'cohere':
      return generateCohereEmbeddings(texts, embeddingModel, apiKeys?.cohere)

    case 'huggingface':
      return generateHuggingFaceEmbeddings(texts, embeddingModel, apiKeys?.huggingface)

    default:
      throw new Error(`Unsupported embedding model provider for model: ${embeddingModel}`)
  }
}

/**
 * Determine the provider from the model name
 */
function getProviderFromModel(embeddingModel: string): string {
  // Check for Ollama models
  if (
    env.OLLAMA_URL &&
    (embeddingModel.includes('nomic-embed') ||
      embeddingModel.includes('mxbai-embed') ||
      embeddingModel.includes('all-minilm') ||
      embeddingModel.includes('bge-') ||
      embeddingModel.includes('sentence-transformers') ||
      // Generic check: if it doesn't look like a cloud provider model, assume Ollama
      (!embeddingModel.startsWith('text-embedding') &&
        !embeddingModel.includes('claude') &&
        !embeddingModel.includes('embed-english') &&
        !embeddingModel.includes('embed-multilingual') &&
        !embeddingModel.includes('all-MiniLM') &&
        !embeddingModel.includes('all-mpnet')))
  ) {
    return 'ollama'
  }

  // Check for OpenAI models
  if (embeddingModel.includes('text-embedding') || embeddingModel.startsWith('text-embedding')) {
    return 'openai'
  }

  // Check for Anthropic models
  if (embeddingModel.includes('claude') && embeddingModel.includes('embedding')) {
    return 'anthropic'
  }

  // Check for Cohere models
  if (embeddingModel.includes('embed-english') || embeddingModel.includes('embed-multilingual')) {
    return 'cohere'
  }

  // Check for Hugging Face models
  if (
    embeddingModel.includes('all-MiniLM') ||
    embeddingModel.includes('all-mpnet') ||
    embeddingModel.includes('sentence-transformers/')
  ) {
    return 'huggingface'
  }

  // Default to OpenAI for unknown models
  return 'openai'
}

/**
 * Generate embeddings using OpenAI API
 */
async function generateOpenAIEmbeddings(
  texts: string[],
  embeddingModel: string,
  apiKey?: string
): Promise<number[][]> {
  const openaiApiKey = apiKey || env.OPENAI_API_KEY
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured. Please add your OpenAI API key.')
  }

  try {
    const batchSize = 100
    const allEmbeddings: number[][] = []

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)

      logger.info(
        `Generating OpenAI embeddings for batch ${Math.floor(i / batchSize) + 1} (${batch.length} texts)`
      )

      const batchEmbeddings = await retryWithExponentialBackoff(
        async () => {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.EMBEDDINGS_API)

          try {
            const response = await fetch('https://api.openai.com/v1/embeddings', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                input: batch,
                model: embeddingModel,
                encoding_format: 'float',
              }),
              signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
              const errorText = await response.text()
              const error = new APIError(
                `OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`,
                response.status
              )
              throw error
            }

            const data: OpenAIEmbeddingResponse = await response.json()
            return data.data.map((item) => item.embedding)
          } catch (error) {
            clearTimeout(timeoutId)
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error('OpenAI API request timed out')
            }
            throw error
          }
        },
        {
          maxRetries: 5,
          initialDelayMs: 1000,
          maxDelayMs: 60000,
          backoffMultiplier: 2,
        }
      )

      allEmbeddings.push(...batchEmbeddings)
    }

    logger.info(`Successfully generated ${allEmbeddings.length} embeddings using OpenAI`)
    return allEmbeddings
  } catch (error) {
    logger.error('Failed to generate OpenAI embeddings:', error)
    throw error
  }
}

/**
 * Generate embeddings using Anthropic API
 */
async function generateAnthropicEmbeddings(
  texts: string[],
  embeddingModel: string,
  apiKey?: string
): Promise<number[][]> {
  const anthropicApiKey = apiKey || env.ANTHROPIC_API_KEY_1
  if (!anthropicApiKey) {
    throw new Error('Anthropic API key not configured. Please add your Anthropic API key.')
  }

  try {
    const allEmbeddings: number[][] = []

    for (const text of texts) {
      logger.info(`Generating Anthropic embedding for text (${text.length} chars)`)

      const embedding = await retryWithExponentialBackoff(
        async () => {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.EMBEDDINGS_API)

          try {
            const response = await fetch('https://api.anthropic.com/v1/embeddings', {
              method: 'POST',
              headers: {
                'x-api-key': anthropicApiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                input: text,
                model: embeddingModel,
              }),
              signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
              const errorText = await response.text()
              throw new APIError(
                `Anthropic API error: ${response.status} ${response.statusText} - ${errorText}`,
                response.status
              )
            }

            const data = await response.json()
            return data.embedding
          } catch (error) {
            clearTimeout(timeoutId)
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error('Anthropic API request timed out')
            }
            throw error
          }
        },
        {
          maxRetries: 3,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          backoffMultiplier: 2,
        }
      )

      allEmbeddings.push(embedding)
    }

    logger.info(`Successfully generated ${allEmbeddings.length} embeddings using Anthropic`)
    return allEmbeddings
  } catch (error) {
    logger.error('Failed to generate Anthropic embeddings:', error)
    throw new Error(
      `Anthropic embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate embeddings using Cohere API
 */
async function generateCohereEmbeddings(
  texts: string[],
  embeddingModel: string,
  apiKey?: string
): Promise<number[][]> {
  if (!apiKey) {
    throw new Error('Cohere API key not configured. Please add your Cohere API key.')
  }

  try {
    const batchSize = 96 // Cohere's batch limit
    const allEmbeddings: number[][] = []

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)

      logger.info(
        `Generating Cohere embeddings for batch ${Math.floor(i / batchSize) + 1} (${batch.length} texts)`
      )

      const batchEmbeddings = await retryWithExponentialBackoff(
        async () => {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.EMBEDDINGS_API)

          try {
            const response = await fetch('https://api.cohere.ai/v1/embed', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                texts: batch,
                model: embeddingModel,
                input_type: 'search_document',
              }),
              signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
              const errorText = await response.text()
              throw new APIError(
                `Cohere API error: ${response.status} ${response.statusText} - ${errorText}`,
                response.status
              )
            }

            const data = await response.json()
            return data.embeddings
          } catch (error) {
            clearTimeout(timeoutId)
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error('Cohere API request timed out')
            }
            throw error
          }
        },
        {
          maxRetries: 3,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          backoffMultiplier: 2,
        }
      )

      allEmbeddings.push(...batchEmbeddings)
    }

    logger.info(`Successfully generated ${allEmbeddings.length} embeddings using Cohere`)
    return allEmbeddings
  } catch (error) {
    logger.error('Failed to generate Cohere embeddings:', error)
    throw new Error(
      `Cohere embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate embeddings using Hugging Face API
 */
async function generateHuggingFaceEmbeddings(
  texts: string[],
  embeddingModel: string,
  apiKey?: string
): Promise<number[][]> {
  if (!apiKey) {
    throw new Error('Hugging Face API key not configured. Please add your Hugging Face API key.')
  }

  try {
    const allEmbeddings: number[][] = []

    for (const text of texts) {
      logger.info(`Generating Hugging Face embedding for text (${text.length} chars)`)

      const embedding = await retryWithExponentialBackoff(
        async () => {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.EMBEDDINGS_API)

          try {
            const response = await fetch(
              `https://api-inference.huggingface.co/pipeline/feature-extraction/${embeddingModel}`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  inputs: text,
                  options: { wait_for_model: true },
                }),
                signal: controller.signal,
              }
            )

            clearTimeout(timeoutId)

            if (!response.ok) {
              const errorText = await response.text()
              throw new APIError(
                `Hugging Face API error: ${response.status} ${response.statusText} - ${errorText}`,
                response.status
              )
            }

            const embedding = await response.json()
            // Hugging Face returns a nested array for sentence transformers
            return Array.isArray(embedding[0]) ? embedding[0] : embedding
          } catch (error) {
            clearTimeout(timeoutId)
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error('Hugging Face API request timed out')
            }
            throw error
          }
        },
        {
          maxRetries: 3,
          initialDelayMs: 2000,
          maxDelayMs: 15000,
          backoffMultiplier: 2,
        }
      )

      allEmbeddings.push(embedding)
    }

    logger.info(`Successfully generated ${allEmbeddings.length} embeddings using Hugging Face`)
    return allEmbeddings
  } catch (error) {
    logger.error('Failed to generate Hugging Face embeddings:', error)
    throw new Error(
      `Hugging Face embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Normalize embedding dimensions to match database schema
 * Pads vectors with zeros if they're shorter than expected dimension
 * Truncates vectors if they're longer than expected dimension
 */
function normalizeEmbeddingDimensions(embeddings: number[][], targetDimension = 2000): number[][] {
  return embeddings.map((embedding) => {
    if (embedding.length === targetDimension) {
      return embedding
    }
    if (embedding.length < targetDimension) {
      // Pad with zeros
      const padded = [...embedding]
      while (padded.length < targetDimension) {
        padded.push(0)
      }
      return padded
    }
    // Truncate (though this should rarely happen)
    return embedding.slice(0, targetDimension)
  })
}

/**
 * Sanitize text content for database storage
 * Removes null bytes and other invalid UTF-8 sequences that PostgreSQL rejects
 */
function sanitizeTextContent(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return (
    text
      // Remove null bytes and other control characters except newlines, tabs, carriage returns
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Replace multiple whitespace sequences with single spaces
      .replace(/\s+/g, ' ')
      // Trim whitespace
      .trim()
  )
}

/**
 * Process a document asynchronously with full error handling
 */
export async function processDocumentAsync(
  knowledgeBaseId: string,
  documentId: string,
  docData: {
    filename: string
    fileUrl: string
    fileSize: number
    mimeType: string
  },
  processingOptions: {
    chunkSize?: number
    minCharactersPerChunk?: number
    recipe?: string
    lang?: string
    chunkOverlap?: number
    embeddingModel?: string
    apiKeys?: Record<string, string>
  }
): Promise<void> {
  const startTime = Date.now()
  try {
    logger.info(`[${documentId}] Starting document processing: ${docData.filename}`)

    // Set status to processing
    await db
      .update(document)
      .set({
        processingStatus: 'processing',
        processingStartedAt: new Date(),
        processingError: null, // Clear any previous error
      })
      .where(eq(document.id, documentId))

    logger.info(`[${documentId}] Status updated to 'processing', starting document processor`)

    // Wrap the entire processing operation with a 5-minute timeout
    await withTimeout(
      (async () => {
        const processed = await processDocument(
          docData.fileUrl,
          docData.filename,
          docData.mimeType,
          processingOptions.chunkSize || 1000,
          processingOptions.chunkOverlap || 200,
          processingOptions.minCharactersPerChunk || 1
        )

        const now = new Date()

        logger.info(
          `[${documentId}] Document parsed successfully, generating embeddings for ${processed.chunks.length} chunks`
        )

        const chunkTexts = processed.chunks.map((chunk) => sanitizeTextContent(chunk.text))
        // Determine the embedding model to use
        let embeddingModel: string
        if (processingOptions.embeddingModel) {
          // Use the model specified in processing options
          embeddingModel = processingOptions.embeddingModel
        } else if (env.OLLAMA_URL || env.DEFAULT_EMBEDDING_MODEL?.includes('nomic')) {
          embeddingModel = env.DEFAULT_EMBEDDING_MODEL || 'nomic-embed-text'
        } else {
          embeddingModel = 'text-embedding-3-small'
        }

        const embeddings =
          chunkTexts.length > 0
            ? await generateEmbeddings(chunkTexts, embeddingModel, processingOptions.apiKeys)
            : []

        // Normalize embedding dimensions to match database schema (2000 dimensions)
        const normalizedEmbeddings =
          embeddings.length > 0 ? normalizeEmbeddingDimensions(embeddings, 2000) : []

        logger.info(
          `[${documentId}] Embeddings generated using model: ${embeddingModel}, normalized to 2000 dimensions, fetching document tags`
        )

        // Fetch document to get tags
        const documentRecord = await db
          .select({
            tag1: document.tag1,
            tag2: document.tag2,
            tag3: document.tag3,
            tag4: document.tag4,
            tag5: document.tag5,
            tag6: document.tag6,
            tag7: document.tag7,
          })
          .from(document)
          .where(eq(document.id, documentId))
          .limit(1)

        const documentTags = documentRecord[0] || {}

        logger.info(`[${documentId}] Creating embedding records with tags`)

        const embeddingRecords = processed.chunks.map((chunk, chunkIndex) => {
          const sanitizedContent = sanitizeTextContent(chunk.text)
          return {
            id: crypto.randomUUID(),
            knowledgeBaseId,
            documentId,
            chunkIndex,
            chunkHash: crypto.createHash('sha256').update(sanitizedContent).digest('hex'),
            content: sanitizedContent,
            contentLength: sanitizedContent.length,
            tokenCount: Math.ceil(sanitizedContent.length / 4),
            embedding: normalizedEmbeddings[chunkIndex] || null,
            embeddingModel: embeddingModel,
            startOffset: chunk.metadata.startIndex,
            endOffset: chunk.metadata.endIndex,
            // Copy tags from document
            tag1: documentTags.tag1,
            tag2: documentTags.tag2,
            tag3: documentTags.tag3,
            tag4: documentTags.tag4,
            tag5: documentTags.tag5,
            tag6: documentTags.tag6,
            tag7: documentTags.tag7,
            createdAt: now,
            updatedAt: now,
          }
        })

        await db.transaction(async (tx) => {
          if (embeddingRecords.length > 0) {
            await tx.insert(embedding).values(embeddingRecords)
          }

          await tx
            .update(document)
            .set({
              chunkCount: processed.metadata.chunkCount,
              tokenCount: processed.metadata.tokenCount,
              characterCount: processed.metadata.characterCount,
              processingStatus: 'completed',
              processingCompletedAt: now,
              processingError: null,
            })
            .where(eq(document.id, documentId))
        })
      })(),
      TIMEOUTS.OVERALL_PROCESSING,
      'Document processing'
    )

    const processingTime = Date.now() - startTime
    logger.info(`[${documentId}] Successfully processed document in ${processingTime}ms`)
  } catch (error) {
    const processingTime = Date.now() - startTime
    logger.error(`[${documentId}] Failed to process document after ${processingTime}ms:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      filename: docData.filename,
      fileUrl: docData.fileUrl,
      mimeType: docData.mimeType,
    })

    await db
      .update(document)
      .set({
        processingStatus: 'failed',
        processingError: error instanceof Error ? error.message : 'Unknown error',
        processingCompletedAt: new Date(),
      })
      .where(eq(document.id, documentId))
  }
}
