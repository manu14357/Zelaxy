import { type NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import type { ModelsObject } from '@/providers/ollama/types'

const logger = createLogger('OllamaModelsAPI')
const OLLAMA_HOST = env.OLLAMA_URL || 'http://localhost:11434'

export const dynamic = 'force-dynamic'

/**
 * Get available Ollama models
 */
export async function GET(request: NextRequest) {
  try {
    logger.debug('Fetching Ollama models', {
      host: OLLAMA_HOST,
    })

    const response = await fetch(`${OLLAMA_HOST}/api/tags`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      logger.debug('Ollama service not available')
      return NextResponse.json({ models: [] })
    }

    const data = (await response.json()) as ModelsObject
    const models = data.models.map((model) => model.name)

    logger.info('Successfully fetched Ollama models', {
      count: models.length,
      models,
    })

    return NextResponse.json({ models })
  } catch (error) {
    logger.debug('Ollama not available', {
      error: error instanceof Error ? error.message : 'Unknown error',
      host: OLLAMA_HOST,
    })

    // Return empty array instead of error to avoid breaking the UI
    return NextResponse.json({ models: [] })
  }
}
