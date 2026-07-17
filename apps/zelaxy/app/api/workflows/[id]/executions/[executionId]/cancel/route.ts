import type { NextRequest } from 'next/server'
import {
  isDistributedCancellationEnabled,
  markExecutionCancelled,
} from '@/lib/execution/cancellation'
import { createLogger } from '@/lib/logs/console/logger'
import { validateWorkflowAccess } from '@/app/api/workflows/middleware'
import { createErrorResponse, createSuccessResponse } from '@/app/api/workflows/utils'

const logger = createLogger('CancelExecutionAPI')

export const dynamic = 'force-dynamic'

/**
 * Requests cancellation of a running workflow execution.
 *
 * Server-side runs (webhook, schedule) execute in the worker, so cancellation is recorded in a
 * shared store the worker polls between layers rather than flipping an in-process flag. Manual runs
 * execute in the browser and cancel directly there — this route is for the runs the browser cannot
 * reach.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; executionId: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { id, executionId } = await params

  try {
    // Cancelling a run does not require it to be deployed
    const validation = await validateWorkflowAccess(request, id, false)
    if (validation.error) {
      return createErrorResponse(validation.error.message, validation.error.status)
    }

    if (!isDistributedCancellationEnabled()) {
      // Without Redis there is no shared store, so a worker on another process cannot be reached.
      // Report this honestly instead of returning a success that does nothing.
      logger.warn(`[${requestId}] Cancellation requested but Redis is not configured`, {
        executionId,
      })
      return createErrorResponse(
        'Cross-instance cancellation requires Redis. Manual runs can be stopped from the editor.',
        503
      )
    }

    const result = await markExecutionCancelled(executionId)

    if (!result.durablyRecorded) {
      return createErrorResponse('Failed to record cancellation', 502)
    }

    logger.info(`[${requestId}] Cancellation recorded for execution ${executionId}`)
    return createSuccessResponse({ executionId, cancelled: true })
  } catch (error: any) {
    logger.error(`[${requestId}] Error cancelling execution`, error)
    return createErrorResponse(error.message || 'Failed to cancel execution', 500)
  }
}
