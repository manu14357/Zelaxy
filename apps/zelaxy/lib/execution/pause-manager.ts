import { and, eq, lte } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { workflowExecutionPause } from '@/db/schema'
import type { PausedExecution } from '@/executor/types'

const logger = createLogger('PauseManager')

/**
 * Server-side persistence for paused runs.
 *
 * The executor produces a PausedExecution (a serialized snapshot) but never touches the DB — it
 * also runs in the browser. Persisting and resuming lives here, on the server, where the worker and
 * the resume API can reach it.
 */

export async function persistPause(params: {
  executionId: string
  workflowId: string
  paused: PausedExecution
}): Promise<string> {
  const { executionId, workflowId, paused } = params
  const id = nanoid()

  await db.insert(workflowExecutionPause).values({
    id,
    executionId,
    workflowId,
    blockId: paused.blockId,
    contextId: paused.contextId,
    pauseKind: paused.pauseKind,
    status: 'waiting',
    snapshot: { snapshot: paused.snapshot } as any,
    resumeAt: paused.resumeAt ? new Date(paused.resumeAt) : null,
  })

  logger.info('Persisted paused execution', { executionId, blockId: paused.blockId, id })
  return id
}

export async function getPauseByContextId(contextId: string) {
  const [row] = await db
    .select()
    .from(workflowExecutionPause)
    .where(eq(workflowExecutionPause.contextId, contextId))
    .limit(1)
  return row ?? null
}

/**
 * Atomically claims a pause for resume: flips waiting -> resumed only if it was still waiting.
 *
 * The conditional update is the guard against a double-resume — a human clicking approve twice, or
 * the time poller racing a manual resume. Returns the claimed row, or null if it was already taken.
 */
export async function claimPauseForResume(contextId: string, resumeInput: Record<string, any>) {
  const existing = await getPauseByContextId(contextId)
  if (!existing || existing.status !== 'waiting') {
    return null
  }

  const updated = await db
    .update(workflowExecutionPause)
    .set({
      status: 'resumed',
      resumeInput: resumeInput as any,
      resumedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(eq(workflowExecutionPause.id, existing.id), eq(workflowExecutionPause.status, 'waiting'))
    )
    .returning()

  return updated.length > 0 ? updated[0] : null
}

/** Time pauses whose resumeAt has elapsed and are still waiting — for the poller to resume. */
export async function getDueTimePauses(limit = 25) {
  return db
    .select()
    .from(workflowExecutionPause)
    .where(
      and(
        eq(workflowExecutionPause.status, 'waiting'),
        eq(workflowExecutionPause.pauseKind, 'time'),
        lte(workflowExecutionPause.resumeAt, new Date())
      )
    )
    .limit(limit)
}

/** Reads the serialized ExecutionContext snapshot back out of a pause row. */
export function readSnapshot(row: { snapshot: unknown }): string {
  const s = row.snapshot as { snapshot?: string }
  return s?.snapshot ?? ''
}
