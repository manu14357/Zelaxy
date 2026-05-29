import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'
import { env } from '@/lib/env'
import { checkRateLimit, createRateLimitResponse } from '@/app/api/v1/middleware'

const logger = createLogger('V1CopilotChatAPI')

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/v1/copilot/chat
 *
 * Proxy for /api/copilot/direct-chat with x-api-key authentication.
 * Accepts the same body as /api/copilot/direct-chat:
 *   { message, workflowId, chatId?, createNewChat?, stream?, provider, model, mode?, customApiKey?, fileAttachments? }
 *
 * Authentication: x-api-key header or session cookie.
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const rateLimit = await checkRateLimit(request, 'copilot-chat')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit)
    }

    // Read body once and forward it
    let body: string
    try {
      body = await request.text()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
    const targetUrl = `${baseUrl}/api/copilot/direct-chat`

    // Forward relevant headers; propagate API key so direct-chat can authenticate
    const forwardHeaders: Record<string, string> = {
      'content-type': 'application/json',
    }

    const apiKey = request.headers.get('x-api-key')
    if (apiKey) {
      forwardHeaders['x-api-key'] = apiKey
    }

    // Forward cookie header for session-based callers
    const cookie = request.headers.get('cookie')
    if (cookie) {
      forwardHeaders['cookie'] = cookie
    }

    logger.info(`[${requestId}] Proxying copilot chat to ${targetUrl}`)

    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: forwardHeaders,
      body,
    })

    // Stream the response back as-is
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error proxying copilot chat`, { error })
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 })
  }
}
