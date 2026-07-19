// Per-job-type BullMQ concurrency resolution.
//
// BullMQ OSS has no per-job-name concurrency: concurrency is a property of a
// Worker, and a Worker is bound to a single queue. To give workflow jobs and
// webhook jobs independent concurrency we run one queue + Worker per job type
// (see queues.ts / worker/index.ts). This module centralises how each Worker's
// concurrency is resolved from the environment.
//
// BACK-COMPAT: with no per-type env vars set, both job types fall back to the
// legacy WORKER_CONCURRENCY value (default 5) — i.e. unchanged behaviour.

// Legacy default used by the single-queue worker before the split.
export const DEFAULT_CONCURRENCY = 5

/**
 * Parse a concurrency env value, returning `undefined` when it is unset,
 * empty, or not a positive integer (so callers can fall back).
 */
function parseConcurrency(raw: string | undefined): number | undefined {
  if (raw === undefined || raw.trim() === '') return undefined
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

/**
 * Resolve a per-type concurrency from a specific env var, falling back to the
 * shared WORKER_CONCURRENCY, then to DEFAULT_CONCURRENCY.
 */
function resolveConcurrency(specific: string | undefined): number {
  return (
    parseConcurrency(specific) ??
    parseConcurrency(process.env.WORKER_CONCURRENCY) ??
    DEFAULT_CONCURRENCY
  )
}

/** Concurrency for the workflow-execution Worker (WORKFLOW_CONCURRENCY). */
export function getWorkflowConcurrency(): number {
  return resolveConcurrency(process.env.WORKFLOW_CONCURRENCY)
}

/** Concurrency for the webhook-execution Worker (WEBHOOK_CONCURRENCY). */
export function getWebhookConcurrency(): number {
  return resolveConcurrency(process.env.WEBHOOK_CONCURRENCY)
}
