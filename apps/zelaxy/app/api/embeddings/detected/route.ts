import { NextResponse } from 'next/server'
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

interface DetectedModel {
  id: string
  name: string
  provider: 'local' | 'cloud'
  providerName: string
  dimensions: number
  available: boolean
  description: string
  requiresApiKey?: boolean
  apiKeyConfigured?: boolean
}

/**
 * Detect available embedding models dynamically
 * This includes:
 * - Local models from Ollama (auto-detected)
 * - Cloud models with configured API keys (stored in user preferences)
 * GET /api/embeddings/detected
 */
export async function GET() {
  try {
    const detectedModels: DetectedModel[] = []

    // 1. Check for local Ollama models
    if (env.OLLAMA_URL) {
      try {
        const response = await fetch(`${env.OLLAMA_URL}/api/tags`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data: OllamaModelsResponse = await response.json()

          // Filter for embedding models
          const embeddingModels = data.models.filter(
            (model) =>
              model.name.includes('embed') ||
              model.name.includes('nomic') ||
              model.name.includes('all-minilm') ||
              model.name.includes('bge-') ||
              model.name.includes('e5-')
          )

          for (const model of embeddingModels) {
            let dimensions = 768 // Default for most local embedding models
            let description = 'Local embedding model'

            // Model-specific configurations
            if (model.name.includes('nomic-embed-text')) {
              dimensions = 768
              description = 'Nomic AI text embedding model (high quality, local)'
            } else if (model.name.includes('all-minilm')) {
              dimensions = 384
              description = 'Sentence-BERT embedding model (lightweight, fast)'
            } else if (model.name.includes('bge-large')) {
              dimensions = 1024
              description = 'BGE large embedding model (high quality)'
            } else if (model.name.includes('bge-base')) {
              dimensions = 768
              description = 'BGE base embedding model (balanced)'
            } else if (model.name.includes('e5-large')) {
              dimensions = 1024
              description = 'E5 large embedding model (multilingual)'
            }

            detectedModels.push({
              id: model.name,
              name: model.name,
              provider: 'local',
              providerName: 'Ollama',
              dimensions,
              available: true,
              description,
              requiresApiKey: false,
            })
          }

          logger.info(`Detected ${embeddingModels.length} local embedding models`)
        }
      } catch (error) {
        logger.warn('Failed to connect to Ollama:', error)
      }
    }

    // 2. Check for configured cloud providers
    // TODO: This would typically check user preferences/database for stored API keys
    // For now, we'll check environment variables

    // OpenAI
    if (env.OPENAI_API_KEY) {
      detectedModels.push(
        {
          id: 'text-embedding-3-small',
          name: 'text-embedding-3-small',
          provider: 'cloud',
          providerName: 'OpenAI',
          dimensions: 1536,
          available: true,
          description: 'OpenAI text embedding model (fast, cost-effective)',
          requiresApiKey: true,
          apiKeyConfigured: true,
        },
        {
          id: 'text-embedding-3-large',
          name: 'text-embedding-3-large',
          provider: 'cloud',
          providerName: 'OpenAI',
          dimensions: 3072,
          available: true,
          description: 'OpenAI text embedding model (high quality, more expensive)',
          requiresApiKey: true,
          apiKeyConfigured: true,
        }
      )
    }

    // 3. Determine default model
    let defaultModel = detectedModels.find((m) => m.available)?.id || ''

    // Prefer local models if available
    const localModel = detectedModels.find((m) => m.provider === 'local' && m.available)
    if (localModel) {
      defaultModel = localModel.id
    }

    // 4. Add suggestions for unconfigured providers
    const suggestions = []

    if (!env.OPENAI_API_KEY) {
      suggestions.push({
        provider: 'OpenAI',
        description: 'Add OpenAI API key to unlock cloud embedding models',
        models: ['text-embedding-3-small', 'text-embedding-3-large'],
      })
    }

    return NextResponse.json({
      success: true,
      models: detectedModels,
      defaultModel,
      suggestions,
      summary: {
        totalModels: detectedModels.length,
        localModels: detectedModels.filter((m) => m.provider === 'local').length,
        cloudModels: detectedModels.filter((m) => m.provider === 'cloud').length,
        ollamaAvailable: !!env.OLLAMA_URL,
      },
    })
  } catch (error) {
    logger.error('Failed to detect embedding models:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to detect available embedding models',
        models: [],
        suggestions: [
          {
            provider: 'Ollama',
            description:
              'Install Ollama and pull embedding models like: ollama pull nomic-embed-text',
            setup: 'https://ollama.ai',
          },
          {
            provider: 'OpenAI',
            description: 'Add OpenAI API key to use cloud embedding models',
            models: ['text-embedding-3-small', 'text-embedding-3-large'],
          },
        ],
      },
      { status: 500 }
    )
  }
}
