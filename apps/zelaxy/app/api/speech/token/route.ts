import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'

export const dynamic = 'force-dynamic'

const logger = createLogger('SpeechTokenAPI')

const ELEVENLABS_TOKEN_URL = 'https://api.elevenlabs.io/v1/single-use-token/realtime_scribe'

// Rate limiting: max 30 tokens per user per ~72 seconds
const rateMap = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT_WINDOW_MS = 72_000
const RATE_LIMIT_MAX = 30

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const record = rateMap.get(userId)

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateMap.set(userId, { count: 1, windowStart: now })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) return false

  record.count++
  return true
}

// POST /api/speech/token — Generate a single-use ElevenLabs realtime transcription token
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const session = await getSession()

    // Allow both authenticated session users and embed/chat users with a chatId
    if (!session?.user?.id) {
      const body = await request.json().catch(() => ({}))
      if (!body?.chatId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      // Public chat — bypass session check but still enforce STT availability
    }

    if (!env.ELEVENLABS_API_KEY) {
      logger.warn(`[${requestId}] ElevenLabs API key not configured`)
      return NextResponse.json(
        { error: 'Speech-to-text service is not configured' },
        { status: 503 }
      )
    }

    const userId = session?.user?.id ?? 'public'

    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before requesting another token.' },
        { status: 429 }
      )
    }

    const tokenResponse = await fetch(ELEVENLABS_TOKEN_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10_000),
    })

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text().catch(() => '')
      logger.error(`[${requestId}] ElevenLabs token request failed: ${tokenResponse.status} ${errText}`)
      return NextResponse.json(
        { error: 'Failed to obtain speech token' },
        { status: 502 }
      )
    }

    const tokenData = await tokenResponse.json()

    logger.debug(`[${requestId}] Speech token issued for user ${userId}`)

    return NextResponse.json({ token: tokenData.signed_url ?? tokenData.token ?? tokenData })
  } catch (error) {
    logger.error(`[${requestId}] Error generating speech token:`, error)
    return NextResponse.json({ error: 'Failed to generate speech token' }, { status: 500 })
  }
}
