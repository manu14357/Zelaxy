import { eq } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console/logger'
import { loadDeployedWorkflowState } from '@/lib/workflows/db-helpers'
import { updateWorkflowRunCounts } from '@/lib/workflows/utils'
import { db } from '@/db'
import { workflowExecutionPause } from '@/db/schema'
import { Executor } from '@/executor'
import type { ExecutionResult } from '@/executor/types'
import { Serializer } from '@/serializer'
import { mergeSubblockState } from '@/stores/workflows/server-utils'
import { deserializeContext } from './context-serializer'
import { persistPause, readSnapshot } from './pause-manager'

const logger = createLogger('ResumeRunner')

/**
 * Resumes a claimed pause to completion (or to the next pause).
 *
 * Reconstructs the executor from the workflow's deployed structure — the run's state comes from the
 * serialized context, not the constructor — deserializes that context, and drives resumeFromPause.
 * If the run pauses again (a second approval gate), the new pause is persisted; if it finishes, the
 * pause row is closed out.
 */
export async function resumePausedExecution(pauseRow: {
  id: string
  executionId: string
  workflowId: string
  blockId: string
  snapshot: unknown
  resumeInput: unknown
}): Promise<ExecutionResult> {
  const { executionId, workflowId, blockId } = pauseRow

  const workflowData = await loadDeployedWorkflowState(workflowId)
  const { blocks, edges, loops, parallels } = workflowData
  const mergedStates = mergeSubblockState(blocks, {})

  const serializer = new Serializer()
  const serializedWorkflow = serializer.serializeWorkflow(
    mergedStates,
    edges,
    loops || {},
    parallels || {},
    true
  )

  const executor = new Executor({
    workflow: serializedWorkflow,
    contextExtensions: { executionId },
  })

  const context = deserializeContext(readSnapshot(pauseRow))
  const resolution = (pauseRow.resumeInput as Record<string, any>) || {}

  const result = await executor.resumeFromPause(context, blockId, resolution)

  if (result.paused) {
    // Paused again at a downstream gate — record the new pause so it can be resumed in turn.
    await persistPause({ executionId, workflowId, paused: result.paused })
    logger.info('Resumed run paused again', { executionId, nextBlockId: result.paused.blockId })
  } else {
    if (result.success) {
      await updateWorkflowRunCounts(workflowId).catch(() => {})
    }
    logger.info('Resumed run finished', { executionId, success: result.success })
  }

  return result
}

/** Marks a time-pause as failed so a poller does not retry a broken snapshot forever. */
export async function failPause(id: string, error: string): Promise<void> {
  await db
    .update(workflowExecutionPause)
    .set({ status: 'cancelled', resumeInput: { error } as any, updatedAt: new Date() })
    .where(eq(workflowExecutionPause.id, id))
}
