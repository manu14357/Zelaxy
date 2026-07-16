import { nanoid } from 'nanoid'
import { type NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/auth/internal'
import { Logger } from '@/lib/logs/console/logger'
import { acquireLock, releaseLock } from '@/lib/redis'
import { pollRssWebhooks } from '@/lib/webhooks/rss-polling-service'

const logger = new Logger('RssPollingAPI')

export const dynamic = 'force-dynamic'
export const maxDuration = 180

const LOCK_KEY = 'rss-polling-lock'
const LOCK_TTL_SECONDS = 180

export async function GET(request: NextRequest) {
  const requestId = nanoid()
  logger.debug(`RSS webhook polling triggered (${requestId})`)

  let lockValue: string | undefined

  try {
    const authError = verifyCronAuth(request, 'RSS webhook polling')
    if (authError) {
      return authError
    }

    lockValue = requestId
    const locked = await acquireLock(LOCK_KEY, lockValue, LOCK_TTL_SECONDS)

    if (!locked) {
      return NextResponse.json(
        {
          success: true,
          message: 'Polling already in progress – skipped',
          requestId,
          status: 'skip',
        },
        { status: 202 }
      )
    }

    const results = await pollRssWebhooks()

    return NextResponse.json({
      success: true,
      message: 'RSS polling completed',
      requestId,
      status: 'completed',
      ...results,
    })
  } catch (error) {
    logger.error(`Error during RSS polling (${requestId}):`, error)
    return NextResponse.json(
      {
        success: false,
        message: 'RSS polling failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      },
      { status: 500 }
    )
  } finally {
    await releaseLock(LOCK_KEY).catch(() => {})
  }
}
