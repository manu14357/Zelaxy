import { env, isTruthy } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import type { ExecutionResult } from '@/executor/types'

const logger = createLogger('ShadowExecutor')

/**
 * Runs a second executor alongside the one that served a request and reports where their results
 * differ, without affecting what was served. Used to compare two execution engines on real traffic.
 *
 * The comparison ignores fields that legitimately vary run-to-run (timings, ordering, run-scoped
 * ids) so only behavioural differences are reported.
 */

/** A single point where two execution results differ. */
export interface ResultDifference {
  path: string
  primary: unknown
  shadow: unknown
}

export interface ComparisonReport {
  divergent: boolean
  differences: ResultDifference[]
}

// Metadata fields that vary between runs of the same workflow.
const VOLATILE_METADATA_KEYS = new Set([
  'startTime',
  'endTime',
  'duration',
  'pendingBlocks',
  'context',
  'workflowConnections',
  'isDebugSession',
])
// Per-block log fields that vary between runs.
const VOLATILE_LOG_KEYS = new Set(['startedAt', 'endedAt', 'durationMs'])

/**
 * Reduces a result to the parts that must match: success, error, final output, pause point, and
 * each block's output keyed by block id. Timing is dropped. Block logs become a map keyed by block
 * id rather than a list, so a different execution ORDER that reaches the same state is not a
 * difference.
 */
export function normalizeResult(result: ExecutionResult): Record<string, unknown> {
  const metadata: Record<string, unknown> = {}
  if (result.metadata) {
    for (const [k, v] of Object.entries(result.metadata)) {
      if (!VOLATILE_METADATA_KEYS.has(k)) {
        metadata[k] = v
      }
    }
  }

  const blocksById: Record<string, unknown> = {}
  for (const log of result.logs ?? []) {
    const entry: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(log)) {
      if (!VOLATILE_LOG_KEYS.has(k)) {
        entry[k] = v
      }
    }
    // A block that ran more than once (loop iterations) keeps its last result.
    blocksById[log.blockId] = entry
  }

  return {
    success: result.success,
    error: result.error,
    output: result.output,
    paused: result.paused
      ? { blockId: result.paused.blockId, pauseKind: result.paused.pauseKind }
      : undefined,
    metadata,
    blocks: blocksById,
  }
}

/** Records every leaf difference between two normalized values. */
function diffValues(path: string, a: unknown, b: unknown, out: ResultDifference[]): void {
  if (a === b) return

  const aObj = a && typeof a === 'object'
  const bObj = b && typeof b === 'object'

  if (!aObj || !bObj) {
    out.push({ path, primary: a, shadow: b })
    return
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      out.push({ path, primary: a, shadow: b })
      return
    }
    for (let i = 0; i < a.length; i++) {
      diffValues(`${path}[${i}]`, a[i], b[i], out)
    }
    return
  }

  const keys = new Set([...Object.keys(a as object), ...Object.keys(b as object)])
  for (const key of keys) {
    diffValues(
      path ? `${path}.${key}` : key,
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
      out
    )
  }
}

/** Compares two execution results after normalization. Pure and deterministic. */
export function compareExecutionResults(
  primary: ExecutionResult,
  shadow: ExecutionResult
): ComparisonReport {
  const differences: ResultDifference[] = []
  diffValues('', normalizeResult(primary), normalizeResult(shadow), differences)
  return { divergent: differences.length > 0, differences }
}

/** Whether shadow comparison is turned on. Off by default because it runs the workflow twice. */
export function isShadowCompareEnabled(): boolean {
  return isTruthy(env.EXECUTOR_SHADOW_COMPARE)
}

/** Fraction of runs to shadow (0..1). Defaults to 1 (every run) when enabled. */
function shadowSampleRate(): number {
  const raw = Number.parseFloat(env.EXECUTOR_SHADOW_SAMPLE_RATE ?? '')
  return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : 1
}

interface ShadowContext {
  workflowId: string
  executionId?: string
  triggerBlockId?: string
}

/**
 * Runs the shadow executor for a workflow whose primary result is already produced, and logs any
 * difference. Never throws into the caller and never changes the served result.
 *
 * @param makeShadowExecutor returns the executor to compare against, or null to skip. Returns null
 *   when no comparison engine is configured, in which case this is a no-op.
 */
export async function shadowCompare(
  primaryResult: ExecutionResult,
  makeShadowExecutor: () => { execute: (id: string, trigger?: string) => Promise<any> } | null,
  ctx: ShadowContext
): Promise<ComparisonReport | null> {
  if (!isShadowCompareEnabled()) return null
  if (Math.random() > shadowSampleRate()) return null

  let shadowExecutor: ReturnType<typeof makeShadowExecutor>
  try {
    shadowExecutor = makeShadowExecutor()
  } catch (error) {
    logger.warn('Shadow executor factory threw; skipping comparison', {
      workflowId: ctx.workflowId,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }

  if (!shadowExecutor) return null

  try {
    const raw = await shadowExecutor.execute(ctx.workflowId, ctx.triggerBlockId)
    const shadowResult: ExecutionResult =
      raw && 'stream' in raw && 'execution' in raw ? raw.execution : raw

    const report = compareExecutionResults(primaryResult, shadowResult)

    if (report.divergent) {
      logger.warn('Shadow executor diverged', {
        workflowId: ctx.workflowId,
        executionId: ctx.executionId,
        differenceCount: report.differences.length,
        // Cap the logged detail so a large divergence cannot flood logs.
        differences: report.differences.slice(0, 20),
      })
    } else {
      logger.info('Shadow executor matched', {
        workflowId: ctx.workflowId,
        executionId: ctx.executionId,
      })
    }

    return report
  } catch (error) {
    logger.error('Shadow execution failed', {
      workflowId: ctx.workflowId,
      executionId: ctx.executionId,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}
