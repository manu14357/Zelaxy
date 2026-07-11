import { unstable_noStore as noStore } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import {
  getWandContent,
  mapWandError,
  runWandGeneration,
  toWandNdjsonResponse,
  type WandMessage,
} from '@/lib/wand/generate'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const logger = createLogger('WandGenerateAPI')

interface RequestBody {
  prompt: string
  systemPrompt?: string
  stream?: boolean
  history?: WandMessage[]
  /** Raw key or a `{{ENV_VAR}}` reference. */
  apiKey?: string
  /** Any model id from the provider registry (OpenAI, Anthropic, Google, …). */
  model?: string
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)
  logger.info(`[${requestId}] Received wand generation request`)

  try {
    noStore()

    // Requires a session: env-var decryption + hosted key rotation are per-user.
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as RequestBody
    const { prompt, systemPrompt, stream = false, history = [], apiKey, model } = body

    if (!prompt) {
      logger.warn(`[${requestId}] Invalid request: Missing prompt.`)
      return NextResponse.json(
        { success: false, error: 'Missing required field: prompt.' },
        { status: 400 }
      )
    }

    const resp = await runWandGeneration({
      userId: session.user.id,
      prompt,
      systemPrompt,
      history,
      apiKey,
      model,
      stream,
    })

    if (stream) {
      logger.info(`[${requestId}] Streaming wand generation`)
      return toWandNdjsonResponse(resp)
    }

    const content = getWandContent(resp)
    if (!content) {
      logger.error(`[${requestId}] Provider response was empty.`)
      return NextResponse.json(
        { success: false, error: 'Failed to generate content. The response was empty.' },
        { status: 500 }
      )
    }

    logger.info(`[${requestId}] Wand generation successful`)
    return NextResponse.json({ success: true, content })
  } catch (error: any) {
    const { message, status } = mapWandError(error)
    logger.error(`[${requestId}] Wand generation failed`, { error: error?.message, status })
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
