import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('ModelsAPI')

const RequestSchema = z.object({
  provider: z.enum(['ollama', 'lmstudio']),
  baseUrl: z.string().url().optional(),
})

interface OllamaModel {
  name: string
  modified_at: string
  size: number
  digest: string
  details?: {
    format: string
    family: string
    parameter_size: string
    quantization_level: string
  }
}

interface OllamaResponse {
  models: OllamaModel[]
}

interface LMStudioModel {
  id: string
  object: string
  created: number
  owned_by: string
}

interface LMStudioResponse {
  data: LMStudioModel[]
  object: string
}

/**
 * GET /api/providers/models
 * Auto-detect available models from local LLM providers (Ollama, LM Studio)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const provider = searchParams.get('provider')
    const customBaseUrl = searchParams.get('baseUrl')

    if (!provider) {
      return NextResponse.json({ error: 'Provider parameter is required' }, { status: 400 })
    }

    if (provider !== 'ollama' && provider !== 'lmstudio') {
      return NextResponse.json(
        { error: 'Only ollama and lmstudio providers support model detection' },
        { status: 400 }
      )
    }

    let baseUrl = ''
    let models: { id: string; name: string; size?: number; details?: string }[] = []

    if (provider === 'ollama') {
      baseUrl = customBaseUrl || process.env.OLLAMA_URL || 'http://localhost:11434'

      try {
        const response = await fetch(`${baseUrl}/api/tags`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        })

        if (!response.ok) {
          throw new Error(`Ollama responded with ${response.status}`)
        }

        const data = (await response.json()) as OllamaResponse

        models = data.models.map((m) => ({
          id: m.name,
          name: m.name.split(':')[0], // Remove tag suffix for display
          size: m.size,
          details: m.details
            ? `${m.details.parameter_size} - ${m.details.quantization_level}`
            : undefined,
        }))

        logger.info('Detected Ollama models', { count: models.length })
      } catch (error) {
        logger.warn('Failed to connect to Ollama', { baseUrl, error: String(error) })
        return NextResponse.json(
          {
            error: 'Failed to connect to Ollama',
            suggestion: `Make sure Ollama is running at ${baseUrl}. Install from https://ollama.ai`,
            available: false,
          },
          { status: 503 }
        )
      }
    } else if (provider === 'lmstudio') {
      baseUrl = customBaseUrl || process.env.LM_STUDIO_URL || 'http://localhost:1234'

      try {
        const response = await fetch(`${baseUrl}/v1/models`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        })

        if (!response.ok) {
          throw new Error(`LM Studio responded with ${response.status}`)
        }

        const data = (await response.json()) as LMStudioResponse

        models = data.data.map((m) => ({
          id: m.id,
          name: m.id,
          details: `Created: ${new Date(m.created * 1000).toLocaleDateString()}`,
        }))

        logger.info('Detected LM Studio models', { count: models.length })
      } catch (error) {
        logger.warn('Failed to connect to LM Studio', { baseUrl, error: String(error) })
        return NextResponse.json(
          {
            error: 'Failed to connect to LM Studio',
            suggestion: `Make sure LM Studio is running at ${baseUrl} with the local server enabled. Download from https://lmstudio.ai`,
            available: false,
          },
          { status: 503 }
        )
      }
    }

    return NextResponse.json({
      provider,
      baseUrl,
      available: true,
      models,
      count: models.length,
    })
  } catch (error) {
    logger.error('Error detecting models', { error: String(error) })
    return NextResponse.json({ error: 'Failed to detect models' }, { status: 500 })
  }
}

/**
 * POST /api/providers/models
 * Test connection to a local LLM provider
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { provider, baseUrl } = RequestSchema.parse(body)

    let testUrl: string
    let available = false
    let message = ''

    if (provider === 'ollama') {
      testUrl = baseUrl || process.env.OLLAMA_URL || 'http://localhost:11434'

      try {
        const response = await fetch(`${testUrl}/api/tags`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        })

        if (response.ok) {
          const data = (await response.json()) as OllamaResponse
          available = true
          message = `Connected! Found ${data.models.length} models.`
        } else {
          message = `Ollama responded with status ${response.status}`
        }
      } catch (error) {
        message = `Cannot connect to Ollama at ${testUrl}. Is it running?`
      }
    } else if (provider === 'lmstudio') {
      testUrl = baseUrl || process.env.LM_STUDIO_URL || 'http://localhost:1234'

      try {
        const response = await fetch(`${testUrl}/v1/models`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        })

        if (response.ok) {
          const data = (await response.json()) as LMStudioResponse
          available = true
          message = `Connected! Found ${data.data.length} models.`
        } else {
          message = `LM Studio responded with status ${response.status}`
        }
      } catch (error) {
        message = `Cannot connect to LM Studio at ${testUrl}. Is the local server enabled?`
      }
    } else {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    return NextResponse.json({
      provider,
      baseUrl: testUrl,
      available,
      message,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 })
    }
    logger.error('Error testing provider connection', { error: String(error) })
    return NextResponse.json({ error: 'Failed to test connection' }, { status: 500 })
  }
}
