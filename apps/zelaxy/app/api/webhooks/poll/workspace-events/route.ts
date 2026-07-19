import { nanoid } from 'nanoid'
import { type NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/auth/internal'
import { Logger } from '@/lib/logs/console/logger'
import { pollWorkspaceEvents } from '@/lib/notifications/workspace-events-polling-service'
import { acquireLock, releaseLock } from '@/lib/redis'

const logger = new Logger('WorkspaceEventsPollingAPI')

export const dynamic = 'force-dynamic'
export const maxDuration = 180

const LOCK_KEY = 'workspace-events-polling-lock'
const LOCK_TTL_SECONDS = 180

export async function GET(request: NextRequest) {
  const requestId = nanoid()
  logger.debug(`Workspace-events polling triggered (${requestId})`)

  let lockValue: string | undefined

  try {
    const authError = verifyCronAuth(request, 'Workspace-events polling')
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

    const results = await pollWorkspaceEvents()

    return NextResponse.json({
      success: true,
      message: 'Workspace-events polling completed',
      requestId,
      status: 'completed',
      ...results,
    })
  } catch (error) {
    logger.error(`Error during workspace-events polling (${requestId}):`, error)
    return NextResponse.json(
      {
        success: false,
        message: 'Workspace-events polling failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      },
      { status: 500 }
    )
  } finally {
    await releaseLock(LOCK_KEY).catch(() => {})
  }
}
