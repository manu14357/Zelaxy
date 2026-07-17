import type { ExecutionContext } from '@/executor/types'

/**
 * Serialize an ExecutionContext to a JSON-safe snapshot and back.
 *
 * The context is the executor's carried state — the same object debug-mode stepping passes back
 * into continueExecution. It is full of Maps and Sets (some nested), which JSON cannot represent,
 * and of callbacks (onStream, pauseExecution) which must NOT be persisted. Persisting a pause means
 * writing this so a resume on any instance rehydrates exactly where the run left off.
 *
 * Approach: a replacer tags every Map/Set with a sentinel so a reviver can rebuild them at any
 * depth. Functions are dropped by JSON.stringify automatically; callbacks are re-attached on resume
 * rather than stored.
 */

const MAP_TAG = '__zelaxy_map__'
const SET_TAG = '__zelaxy_set__'

function replacer(_key: string, value: unknown): unknown {
  if (value instanceof Map) {
    return { [MAP_TAG]: Array.from(value.entries()) }
  }
  if (value instanceof Set) {
    return { [SET_TAG]: Array.from(value.values()) }
  }
  return value
}

function reviveNode(value: any): any {
  if (value === null || typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(reviveNode)
  }

  if (MAP_TAG in value) {
    const entries = (value[MAP_TAG] as [unknown, unknown][]).map(
      ([k, v]) => [k, reviveNode(v)] as [unknown, unknown]
    )
    return new Map(entries)
  }

  if (SET_TAG in value) {
    return new Set((value[SET_TAG] as unknown[]).map(reviveNode))
  }

  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value)) {
    out[k] = reviveNode(v)
  }
  return out
}

export function serializeContext(context: ExecutionContext): string {
  // onStream / pauseExecution are functions; JSON.stringify drops them. They are re-attached on
  // resume, never persisted — a serialized callback would be meaningless on another instance.
  return JSON.stringify(context, replacer)
}

export function deserializeContext(snapshot: string | object): ExecutionContext {
  const parsed = typeof snapshot === 'string' ? JSON.parse(snapshot) : snapshot
  return reviveNode(parsed) as ExecutionContext
}

/**
 * Whether a paused context can be resumed by the current engine.
 *
 * A pause inside an active loop or parallel carries nested iteration state whose faithful resume is
 * the DAG-executor work, not yet done. Rather than resume it wrongly (silent corruption), such a
 * pause is rejected up front so it fails safe. Returns a reason string when unsupported, else null.
 */
export function unsupportedPauseReason(context: ExecutionContext): string | null {
  const hasActiveParallel =
    context.parallelExecutions instanceof Map && context.parallelExecutions.size > 0
  const hasActiveLoop = context.loopExecutions instanceof Map && context.loopExecutions.size > 0

  if (hasActiveParallel) {
    return 'Pausing inside a parallel block is not yet supported'
  }
  if (hasActiveLoop) {
    return 'Pausing inside a loop block is not yet supported'
  }
  return null
}
