import { type NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('EmbeddingDetectionAPI')

interface OllamaModel {
  name: string
  modified_at: string
  size: number
  digest: string
}

interface OllamaModelsResponse {
  models: OllamaModel[]
}

interface EmbeddingModel {
  id: string
  provider: string
  name: string
  dimensions: number
  available: boolean
  description: string
  requiresApiKey?: boolean
}

interface CloudProvider {
  id: string
  name: string
  description: string
  apiKeyRequired: boolean
  models: Omit<EmbeddingModel, 'available'>[]
}

/**
 * Detect available embedding models dynamically
 * GET /api/embeddings/detect - Detect with environment API keys
 * POST /api/embeddings/detect - Test with provided API keys
 */
export async function GET() {
  try {
    const detectedModels: EmbeddingModel[] = []

    // 1. Check Ollama models (local)
    await detectOllamaModels(detectedModels)

    // 2. Check OpenAI models (environment API key)
    if (env.OPENAI_API_KEY) {
      await detectOpenAIModels(detectedModels, env.OPENAI_API_KEY)
    }

    // 3. Return cloud providers info for user to add their own API keys
    const cloudProviders = getCloudProviders()

    return NextResponse.json({
      success: true,
      data: {
        detectedModels,
        cloudProviders,
        recommendations: {
          local: detectedModels.find((m) => m.provider === 'Ollama' && m.available),
          cloud: detectedModels.find((m) => m.provider === 'OpenAI' && m.available),
        },
      },
    })
  } catch (error) {
    logger.error('Failed to detect embedding models:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to detect embedding models' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { apiKeys } = await request.json()
    const detectedModels: EmbeddingModel[] = []

    // 1. Always check Ollama models (local)
    await detectOllamaModels(detectedModels)

    // 2. Check environment API keys
    if (env.OPENAI_API_KEY) {
      await detectOpenAIModels(detectedModels, env.OPENAI_API_KEY)
    }

    // 3. Test provided API keys
    if (apiKeys?.openai) {
      await detectOpenAIModels(detectedModels, apiKeys.openai, 'user-provided')
    }
    if (apiKeys?.anthropic) {
      await detectAnthropicModels(detectedModels, apiKeys.anthropic, 'user-provided')
    }
    if (apiKeys?.cohere) {
      await detectCohereModels(detectedModels, apiKeys.cohere, 'user-provided')
    }
    if (apiKeys?.huggingface) {
      await detectHuggingFaceModels(detectedModels, apiKeys.huggingface, 'user-provided')
    }

    return NextResponse.json({
      success: true,
      data: {
        detectedModels,
        cloudProviders: getCloudProviders(),
      },
    })
  } catch (error) {
    logger.error('Failed to test API keys:', error)
    return NextResponse.json({ success: false, error: 'Failed to test API keys' }, { status: 500 })
  }
}

async function detectOllamaModels(detectedModels: EmbeddingModel[]) {
  if (!env.OLLAMA_URL) {
    // Suggest Ollama setup with popular embedding models
    const suggestedModels = [
      {
        id: 'ollama-nomic-embed-text',
        name: 'nomic-embed-text',
        dimensions: 768,
        description: 'High-quality local embedding model (run: ollama pull nomic-embed-text)',
      },
      {
        id: 'ollama-all-minilm',
        name: 'all-minilm',
        dimensions: 384,
        description: 'Lightweight sentence embeddings (run: ollama pull all-minilm)',
      },
      {
        id: 'ollama-mxbai-embed-large',
        name: 'mxbai-embed-large',
        dimensions: 1024,
        description: 'Large context embedding model (run: ollama pull mxbai-embed-large)',
      },
    ]

    suggestedModels.forEach((model) => {
      detectedModels.push({
        ...model,
        provider: 'Ollama',
        available: false,
      })
    })
    return
  }

  try {
    const response = await fetch(`${env.OLLAMA_URL}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const data: OllamaModelsResponse = await response.json()

    // Filter for embedding models with better pattern matching
    const embeddingModels = data.models.filter(
      (model) =>
        model.name.includes('embed') ||
        model.name.includes('nomic') ||
        model.name.includes('all-minilm') ||
        model.name.includes('all-mpnet') ||
        model.name.includes('bge-') ||
        model.name.includes('e5-') ||
        model.name.includes('gte-') ||
        model.name.includes('mxbai') ||
        model.name.includes('sentence-transformers')
    )

    for (const model of embeddingModels) {
      let dimensions = 768 // Default
      let description = 'Local embedding model via Ollama'

      // Specific model configurations with better detection
      if (model.name.includes('nomic-embed-text')) {
        dimensions = 768
        description = 'High-quality text embeddings by Nomic AI'
      } else if (model.name.includes('all-minilm')) {
        dimensions = 384
        description = 'Lightweight and fast sentence embeddings'
      } else if (model.name.includes('all-mpnet')) {
        dimensions = 768
        description = 'High-quality sentence embeddings with great performance'
      } else if (model.name.includes('bge-large')) {
        dimensions = 1024
        description = 'BGE Large - High-quality English/Chinese embeddings'
      } else if (model.name.includes('bge-base')) {
        dimensions = 768
        description = 'BGE Base - Balanced performance and speed'
      } else if (model.name.includes('bge-small')) {
        dimensions = 512
        description = 'BGE Small - Lightweight and fast'
      } else if (model.name.includes('e5-large')) {
        dimensions = 1024
        description = 'E5 Large - Multilingual embedding model'
      } else if (model.name.includes('e5-base')) {
        dimensions = 768
        description = 'E5 Base - Multilingual text embeddings'
      } else if (model.name.includes('gte-large')) {
        dimensions = 1024
        description = 'GTE Large - General text embeddings'
      } else if (model.name.includes('mxbai-embed-large')) {
        dimensions = 1024
        description = 'MixedBread Large - High-performance embedding model'
      }

      detectedModels.push({
        id: `ollama-${model.name}`,
        provider: 'Ollama',
        name: model.name,
        dimensions,
        available: true,
        description,
      })
    }

    // If no embedding models found, suggest popular ones
    if (embeddingModels.length === 0) {
      const suggestedModels = [
        {
          id: 'ollama-nomic-embed-text',
          name: 'nomic-embed-text',
          dimensions: 768,
          description: 'High-quality local embedding model (run: ollama pull nomic-embed-text)',
        },
        {
          id: 'ollama-all-minilm',
          name: 'all-minilm',
          dimensions: 384,
          description: 'Lightweight sentence embeddings (run: ollama pull all-minilm)',
        },
      ]

      suggestedModels.forEach((model) => {
        detectedModels.push({
          ...model,
          provider: 'Ollama',
          available: false,
        })
      })
    }
  } catch (error) {
    logger.warn('Failed to fetch Ollama models:', error)
    detectedModels.push({
      id: 'ollama-nomic-embed-text',
      provider: 'Ollama',
      name: 'nomic-embed-text',
      dimensions: 768,
      available: false,
      description: 'Ollama connection failed - check if Ollama is running',
    })
  }
}

async function detectOpenAIModels(
  detectedModels: EmbeddingModel[],
  apiKey: string,
  source: 'environment' | 'user-provided' = 'environment'
) {
  try {
    // Test the API key by making a simple request
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    const available = response.ok
    const suffix = source === 'user-provided' ? ' (user API key)' : ''

    // Get predefined OpenAI models from cloud providers
    const cloudProviders = getCloudProviders()
    const openaiProvider = cloudProviders.find((p) => p.id === 'openai')

    if (openaiProvider) {
      const openAIModels = openaiProvider.models.map((model) => ({
        id: `${model.id}${source === 'user-provided' ? '-user' : ''}`,
        provider: model.provider,
        name: model.name,
        dimensions: model.dimensions,
        available,
        description: `${model.description}${suffix}`,
        requiresApiKey: true,
      }))

      detectedModels.push(...openAIModels)
    }
  } catch (error) {
    logger.warn('Failed to test OpenAI API key:', error)
    // Add models as unavailable if API test fails
    const cloudProviders = getCloudProviders()
    const openaiProvider = cloudProviders.find((p) => p.id === 'openai')

    if (openaiProvider) {
      const openAIModels = openaiProvider.models.map((model) => ({
        id: `${model.id}${source === 'user-provided' ? '-user' : ''}`,
        provider: model.provider,
        name: model.name,
        dimensions: model.dimensions,
        available: false,
        description: `${model.description} - API key invalid or connection failed`,
        requiresApiKey: true,
      }))

      detectedModels.push(...openAIModels)
    }
  }
}

async function detectAnthropicModels(
  detectedModels: EmbeddingModel[],
  apiKey: string,
  source: 'environment' | 'user-provided' = 'environment'
) {
  try {
    // Test the API key - Anthropic doesn't have a simple models endpoint
    // So we'll just validate the key format and assume it works if properly formatted
    const available = apiKey.startsWith('sk-ant-') && apiKey.length > 20
    const suffix = source === 'user-provided' ? ' (user API key)' : ''

    const cloudProviders = getCloudProviders()
    const anthropicProvider = cloudProviders.find((p) => p.id === 'anthropic')

    if (anthropicProvider) {
      const anthropicModels = anthropicProvider.models.map((model) => ({
        id: `${model.id}${source === 'user-provided' ? '-user' : ''}`,
        provider: model.provider,
        name: model.name,
        dimensions: model.dimensions,
        available,
        description: `${model.description}${suffix}`,
        requiresApiKey: true,
      }))

      detectedModels.push(...anthropicModels)
    }
  } catch (error) {
    logger.warn('Failed to test Anthropic API key:', error)
  }
}

async function detectCohereModels(
  detectedModels: EmbeddingModel[],
  apiKey: string,
  source: 'environment' | 'user-provided' = 'environment'
) {
  try {
    // Test Cohere API key with a simple request
    const response = await fetch('https://api.cohere.ai/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    const available = response.ok
    const suffix = source === 'user-provided' ? ' (user API key)' : ''

    const cloudProviders = getCloudProviders()
    const cohereProvider = cloudProviders.find((p) => p.id === 'cohere')

    if (cohereProvider) {
      const cohereModels = cohereProvider.models.map((model) => ({
        id: `${model.id}${source === 'user-provided' ? '-user' : ''}`,
        provider: model.provider,
        name: model.name,
        dimensions: model.dimensions,
        available,
        description: `${model.description}${suffix}`,
        requiresApiKey: true,
      }))

      detectedModels.push(...cohereModels)
    }
  } catch (error) {
    logger.warn('Failed to test Cohere API key:', error)
  }
}

async function detectHuggingFaceModels(
  detectedModels: EmbeddingModel[],
  apiKey: string,
  source: 'environment' | 'user-provided' = 'environment'
) {
  try {
    // Test Hugging Face API key
    const response = await fetch('https://api-inference.huggingface.co/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    const available = response.ok
    const suffix = source === 'user-provided' ? ' (user API key)' : ''

    const cloudProviders = getCloudProviders()
    const hfProvider = cloudProviders.find((p) => p.id === 'huggingface')

    if (hfProvider) {
      const hfModels = hfProvider.models.map((model) => ({
        id: `${model.id}${source === 'user-provided' ? '-user' : ''}`,
        provider: model.provider,
        name: model.name,
        dimensions: model.dimensions,
        available,
        description: `${model.description}${suffix}`,
        requiresApiKey: true,
      }))

      detectedModels.push(...hfModels)
    }
  } catch (error) {
    logger.warn('Failed to test Hugging Face API key:', error)
  }
}

function getCloudProviders(): CloudProvider[] {
  return [
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'High-quality embedding models from OpenAI',
      apiKeyRequired: true,
      models: [
        {
          id: 'openai-text-embedding-3-small',
          provider: 'OpenAI',
          name: 'text-embedding-3-small',
          dimensions: 1536,
          description: 'Fast and efficient, best for most use cases',
          requiresApiKey: true,
        },
        // Note: text-embedding-3-large (3072 dims) exceeds our 2000-dimension limit
        // {
        //   id: 'openai-text-embedding-3-large',
        //   provider: 'OpenAI',
        //   name: 'text-embedding-3-large',
        //   dimensions: 3072,
        //   description: 'Highest quality, more expensive - DISABLED: exceeds 2000 dimension limit',
        //   requiresApiKey: true,
        // },
        {
          id: 'openai-text-embedding-ada-002',
          provider: 'OpenAI',
          name: 'text-embedding-ada-002',
          dimensions: 1536,
          description: 'Legacy model, still reliable and cost-effective',
          requiresApiKey: true,
        },
      ],
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      description: 'Claude-powered embedding capabilities',
      apiKeyRequired: true,
      models: [
        {
          id: 'anthropic-claude-3-embeddings',
          provider: 'Anthropic',
          name: 'claude-3-embeddings',
          dimensions: 1536,
          description: 'High-quality embeddings from Claude 3',
          requiresApiKey: true,
        },
      ],
    },
    {
      id: 'cohere',
      name: 'Cohere',
      description: 'Multilingual and English embedding models',
      apiKeyRequired: true,
      models: [
        {
          id: 'cohere-embed-english-v3.0',
          provider: 'Cohere',
          name: 'embed-english-v3.0',
          dimensions: 1024,
          description: 'Latest English embedding model with improved performance',
          requiresApiKey: true,
        },
        {
          id: 'cohere-embed-multilingual-v3.0',
          provider: 'Cohere',
          name: 'embed-multilingual-v3.0',
          dimensions: 1024,
          description: 'Supports 100+ languages with high quality',
          requiresApiKey: true,
        },
        {
          id: 'cohere-embed-english-light-v3.0',
          provider: 'Cohere',
          name: 'embed-english-light-v3.0',
          dimensions: 384,
          description: 'Lightweight English model, faster inference',
          requiresApiKey: true,
        },
        {
          id: 'cohere-embed-multilingual-light-v3.0',
          provider: 'Cohere',
          name: 'embed-multilingual-light-v3.0',
          dimensions: 384,
          description: 'Lightweight multilingual model',
          requiresApiKey: true,
        },
      ],
    },
    {
      id: 'huggingface',
      name: 'Hugging Face',
      description: 'Open-source embedding models via Hugging Face API',
      apiKeyRequired: true,
      models: [
        {
          id: 'hf-sentence-transformers-all-MiniLM-L6-v2',
          provider: 'Hugging Face',
          name: 'sentence-transformers/all-MiniLM-L6-v2',
          dimensions: 384,
          description: 'Lightweight and fast sentence embeddings',
          requiresApiKey: true,
        },
        {
          id: 'hf-sentence-transformers-all-mpnet-base-v2',
          provider: 'Hugging Face',
          name: 'sentence-transformers/all-mpnet-base-v2',
          dimensions: 768,
          description: 'High-quality sentence embeddings with great performance',
          requiresApiKey: true,
        },
        {
          id: 'hf-sentence-transformers-all-MiniLM-L12-v2',
          provider: 'Hugging Face',
          name: 'sentence-transformers/all-MiniLM-L12-v2',
          dimensions: 384,
          description: 'Balanced model between speed and quality',
          requiresApiKey: true,
        },
        {
          id: 'hf-intfloat-e5-large-v2',
          provider: 'Hugging Face',
          name: 'intfloat/e5-large-v2',
          dimensions: 1024,
          description: 'High-performance multilingual embedding model',
          requiresApiKey: true,
        },
        {
          id: 'hf-BAAI-bge-large-en-v1.5',
          provider: 'Hugging Face',
          name: 'BAAI/bge-large-en-v1.5',
          dimensions: 1024,
          description: 'SOTA English embedding model from Beijing Academy of AI',
          requiresApiKey: true,
        },
      ],
    },
  ]
}
