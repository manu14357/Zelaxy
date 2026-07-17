import { nanoid } from 'nanoid'
import { type NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/auth/internal'
import { getDueTimePauses } from '@/lib/execution/pause-manager'
import { failPause, resumePausedExecution } from '@/lib/execution/resume-runner'
import { createLogger } from '@/lib/logs/console/logger'
import { acquireLock, releaseLock } from '@/lib/redis'

const logger = createLogger('ResumePollAPI')

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const LOCK_KEY = 'resume-poll-lock'
const LOCK_TTL_SECONDS = 300

/**
 * Resumes async-wait pauses whose resume time has elapsed.
 *
 * Called on a schedule (like the other pollers). A Redis lock stops two cron firings from resuming
 * the same pause at once; the claim inside claimPauseForResume is the second guard.
 */
export async function GET(request: NextRequest) {
  const requestId = nanoid()

  const authError = verifyCronAuth(request, 'Resume polling')
  if (authError) {
    return authError
  }

  const locked = await acquireLock(LOCK_KEY, requestId, LOCK_TTL_SECONDS)
  if (!locked) {
    return NextResponse.json({ status: 'skip', message: 'Already polling' }, { status: 202 })
  }

  let resumed = 0
  let failed = 0

  try {
    const due = await getDueTimePauses()

    for (const pause of due) {
      try {
        // Claim by flipping to resumed (the poller and a manual resume cannot both win)
        const { claimPauseForResume } = await import('@/lib/execution/pause-manager')
        const claimed = await claimPauseForResume(pause.contextId, { resumedByTimer: true })
        if (!claimed) continue

        await resumePausedExecution(claimed)
        resumed++
      } catch (error: any) {
        failed++
        logger.error(`[${requestId}] Failed to resume time pause`, {
          id: pause.id,
          error: error.message,
        })
        await failPause(pause.id, error.message).catch(() => {})
      }
    }

    return NextResponse.json({ success: true, requestId, resumed, failed, total: due.length })
  } catch (error: any) {
    logger.error(`[${requestId}] Resume polling failed`, error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  } finally {
    await releaseLock(LOCK_KEY).catch(() => {})
  }
}
