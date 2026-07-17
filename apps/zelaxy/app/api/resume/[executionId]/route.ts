import { type NextRequest, NextResponse } from 'next/server'
import { claimPauseForResume } from '@/lib/execution/pause-manager'
import { resumePausedExecution } from '@/lib/execution/resume-runner'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('ResumeAPI')

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Resolves a human-in-the-loop pause.
 *
 * This is the target of the approve/reject links the HITL block hands to a human, so it is a GET:
 * the reviewer clicks a link. The contextId scopes the click to the exact pause, and the resolution
 * is claimed atomically so a double-click or a stale second link cannot resume the run twice.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ executionId: string }> }
) {
  const { executionId } = await params
  const url = new URL(request.url)
  const contextId = url.searchParams.get('contextId')
  const approved = url.searchParams.get('approved') === 'true'

  if (!contextId) {
    return NextResponse.json({ error: 'Missing contextId' }, { status: 400 })
  }

  try {
    const claimed = await claimPauseForResume(contextId, { approved })
    if (!claimed) {
      // Already resumed, cancelled, or unknown — report it rather than resuming twice.
      return NextResponse.json(
        { error: 'This request has already been resolved or does not exist' },
        { status: 409 }
      )
    }

    const result = await resumePausedExecution(claimed)

    return NextResponse.json({
      success: result.success,
      executionId,
      approved,
      status: result.paused ? 'paused_again' : result.success ? 'completed' : 'failed',
      error: result.error,
    })
  } catch (error: any) {
    logger.error('Failed to resume execution', { executionId, contextId, error: error.message })
    return NextResponse.json({ error: error.message || 'Failed to resume' }, { status: 500 })
  }
}

/** POST accepts a structured resolution body (input beyond a yes/no), for programmatic resumes. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ executionId: string }> }
) {
  const { executionId } = await params

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const contextId = body?.contextId
  if (!contextId) {
    return NextResponse.json({ error: 'Missing contextId' }, { status: 400 })
  }

  try {
    const claimed = await claimPauseForResume(contextId, body?.resolution ?? { approved: true })
    if (!claimed) {
      return NextResponse.json({ error: 'Already resolved or unknown' }, { status: 409 })
    }

    const result = await resumePausedExecution(claimed)
    return NextResponse.json({
      success: result.success,
      executionId,
      status: result.paused ? 'paused_again' : result.success ? 'completed' : 'failed',
      error: result.error,
    })
  } catch (error: any) {
    logger.error('Failed to resume execution', { executionId, contextId, error: error.message })
    return NextResponse.json({ error: error.message || 'Failed to resume' }, { status: 500 })
  }
}
