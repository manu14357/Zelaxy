import crypto from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { checkHybridAuth } from '@/lib/auth/hybrid'
import { createLogger } from '@/lib/logs/console/logger'
import { accessError, checkAccess } from '@/app/api/table/utils'

export const dynamic = 'force-dynamic'

const logger = createLogger('TableEventStreamAPI')

/**
 * GET /api/table/[tableId]/events/stream — Server-Sent Events stream for table changes.
 *
 * This is a minimal stub implementation. Clients connect and receive a
 * `connected` event immediately. Full real-time push requires an external
 * pub/sub mechanism (Redis, etc.) which can be wired in later.
 */
export async function GET(req: NextRequest, context: { params: Promise<{ tableId: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { tableId } = await context.params

  try {
    const authResult = await checkHybridAuth(req, { requireWorkflowId: false })
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const access = await checkAccess(tableId, authResult.userId, 'read')
    if (!access.ok) return accessError(access, requestId, tableId)

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      start(controller) {
        // Send a connected event
        const id = crypto.randomUUID()
        const data = JSON.stringify({ type: 'connected', tableId, at: new Date().toISOString() })
        controller.enqueue(encoder.encode(`id: ${id}\ndata: ${data}\n\n`))
        logger.info(`[${requestId}] SSE stream connected for table ${tableId}`)
      },
      cancel() {
        logger.info(`[${requestId}] SSE stream disconnected for table ${tableId}`)
      },
    })

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error creating SSE stream for table ${tableId}:`, error)
    return NextResponse.json({ error: 'Failed to start event stream' }, { status: 500 })
  }
}
