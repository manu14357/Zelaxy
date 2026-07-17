import { createLogger } from '@/lib/logs/console/logger'
import { getRedisClient } from '@/lib/redis'

const logger = createLogger('ExecutionCancellation')

const EXECUTION_CANCEL_PREFIX = 'execution:cancel:'
/** Long enough to outlive any realistic run, short enough that keys do not accumulate. */
const EXECUTION_CANCEL_EXPIRY_SECONDS = 60 * 60

export type ExecutionCancellationResult =
  | { durablyRecorded: true; reason: 'recorded' }
  | { durablyRecorded: false; reason: 'redis_unavailable' | 'redis_write_failed' }

/**
 * Cross-instance workflow cancellation.
 *
 * Manual runs execute in the browser, where the Executor's in-process flag is sufficient — the
 * executor being cancelled is the one the user is looking at. Runs started by a webhook or a
 * schedule execute in the worker, in a different process (often a different machine), so an
 * in-process flag cannot reach them. This records the intent somewhere both can see.
 *
 * Redis is optional in Zelaxy. Without it, cancellation degrades to in-process only rather than
 * failing — a self-hosted single-instance deploy should not be forced to run Redis.
 */
export function isDistributedCancellationEnabled(): boolean {
  return getRedisClient() !== null
}

/**
 * Records a cancellation so any process running the execution will observe it.
 *
 * The caller is told whether the intent was durably recorded; a false result means the request was
 * accepted but only in-process listeners can act on it, which the API surfaces rather than
 * silently pretending the run was cancelled.
 */
export async function markExecutionCancelled(
  executionId: string
): Promise<ExecutionCancellationResult> {
  const redis = getRedisClient()

  if (!redis) {
    logger.warn('Cancellation requested without Redis — cannot reach other instances', {
      executionId,
    })
    return { durablyRecorded: false, reason: 'redis_unavailable' }
  }

  try {
    await redis.set(
      `${EXECUTION_CANCEL_PREFIX}${executionId}`,
      '1',
      'EX',
      EXECUTION_CANCEL_EXPIRY_SECONDS
    )
    logger.info('Marked execution as cancelled', { executionId })
    return { durablyRecorded: true, reason: 'recorded' }
  } catch (error) {
    logger.error('Failed to record cancellation', { executionId, error })
    return { durablyRecorded: false, reason: 'redis_write_failed' }
  }
}

/**
 * Whether this execution has been cancelled from anywhere.
 *
 * Deliberately fails open: if Redis is unreachable we return false and let the run continue. The
 * alternative — treating an infrastructure blip as "cancel everything" — would abort healthy runs.
 */
export async function isExecutionCancelled(executionId: string): Promise<boolean> {
  const redis = getRedisClient()

  if (!redis) {
    return false
  }

  try {
    return (await redis.exists(`${EXECUTION_CANCEL_PREFIX}${executionId}`)) === 1
  } catch (error) {
    logger.error('Failed to check cancellation, continuing execution', { executionId, error })
    return false
  }
}

/** Clears the flag once a run has finished, so a reused execution id cannot inherit it. */
export async function clearExecutionCancellation(executionId: string): Promise<void> {
  const redis = getRedisClient()

  if (!redis) {
    return
  }

  try {
    await redis.del(`${EXECUTION_CANCEL_PREFIX}${executionId}`)
  } catch (error) {
    logger.error('Failed to clear cancellation flag', { executionId, error })
  }
}
