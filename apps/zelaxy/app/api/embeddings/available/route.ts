import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('EmbeddingModelsAPI')

interface OllamaModel {
  name: string
  modified_at: string
  size: number
  digest: string
}

interface OllamaModelsResponse {
  models: OllamaModel[]
}

/**
 * Get available embedding models from Ollama and OpenAI
 * GET /api/embeddings/available
 */
export async function GET() {
  try {
    const availableModels: {
      provider: string
      model: string
      dimensions: number
      available: boolean
      description: string
    }[] = []

    // OpenAI Models
    const hasOpenAI = !!env.OPENAI_API_KEY
    availableModels.push(
      {
        provider: 'OpenAI',
        model: 'text-embedding-3-small',
        dimensions: 1536,
        available: hasOpenAI,
        description: 'OpenAI text embedding model (small, fast)',
      },
      {
        provider: 'OpenAI',
        model: 'text-embedding-3-large',
        dimensions: 3072,
        available: hasOpenAI,
        description: 'OpenAI text embedding model (large, more accurate)',
      },
      {
        provider: 'OpenAI',
        model: 'text-embedding-ada-002',
        dimensions: 1536,
        available: hasOpenAI,
        description: 'OpenAI legacy embedding model',
      }
    )

    // Ollama Models
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
          const embeddingModels = data.models.filter(
            (model) =>
              model.name.includes('embed') ||
              model.name.includes('nomic') ||
              model.name.includes('all-minilm')
          )

          for (const model of embeddingModels) {
            let dimensions = 768 // Default for most local embedding models
            let description = 'Local embedding model'

            // Specific model information
            if (model.name.includes('nomic-embed-text')) {
              dimensions = 768
              description = 'Nomic AI text embedding model (local, good quality)'
            } else if (model.name.includes('all-minilm')) {
              dimensions = 384
              description = 'Sentence-BERT embedding model (local, lightweight)'
            }

            availableModels.push({
              provider: 'Ollama',
              model: model.name,
              dimensions,
              available: true,
              description,
            })
          }
        }
      } catch (error) {
        logger.warn('Failed to fetch Ollama models:', error)
        // Add nomic-embed-text as a fallback suggestion
        availableModels.push({
          provider: 'Ollama',
          model: 'nomic-embed-text',
          dimensions: 768,
          available: false,
          description: 'Nomic AI text embedding model (requires: ollama pull nomic-embed-text)',
        })
      }
    } else {
      // Suggest common Ollama embedding models
      availableModels.push({
        provider: 'Ollama',
        model: 'nomic-embed-text',
        dimensions: 768,
        available: false,
        description: 'Nomic AI text embedding model (requires Ollama setup)',
      })
    }

    // Current configuration
    const currentModel = env.DEFAULT_EMBEDDING_MODEL || 'auto'
    let defaultProvider = 'auto'

    if (env.OLLAMA_URL || env.DEFAULT_EMBEDDING_MODEL?.includes('nomic')) {
      defaultProvider = 'Ollama'
    } else if (env.OPENAI_API_KEY) {
      defaultProvider = 'OpenAI'
    }

    return NextResponse.json({
      success: true,
      data: {
        currentModel,
        defaultProvider,
        availableModels,
        recommendations: {
          local: 'nomic-embed-text (via Ollama)',
          cloud: 'text-embedding-3-small (via OpenAI)',
          setup: {
            ollama: 'Set OLLAMA_URL and run: ollama pull nomic-embed-text',
            openai: 'Set OPENAI_API_KEY in your environment',
          },
        },
      },
    })
  } catch (error) {
    logger.error('Failed to get available embedding models:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve available embedding models',
      },
      { status: 500 }
    )
  }
}
