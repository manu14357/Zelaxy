import { createLogger } from '@/lib/logs/console/logger'
import type { AuthenticatedSocket } from '@/socket-server/middleware/auth'

const logger = createLogger('RateLimit')

/**
 * Per-socket token-bucket rate limiting for realtime collaborative ops.
 *
 * Each socket gets TWO independent buckets:
 *
 *  - LOOSE  — high-frequency, read-only-safe position ops (`update-position`,
 *             `batch-update-positions`). Read-only collaborators are ONLY permitted
 *             `update-position`, so throttling this bucket stutters live drags and would
 *             effectively kick viewers. It is deliberately generous: a 60fps drag emits ~60
 *             ops/s, well under the sustained refill rate, and the large burst capacity absorbs
 *             multi-second drag bursts without a hiccup.
 *
 *  - TIGHT  — mutating structural ops (add / remove / subblock-update / variable-update, etc.).
 *             Abuse here corrupts shared state or hammers the database, so it is capped tighter,
 *             while still sitting comfortably above real human editing rates.
 *
 * On exhaustion the caller REJECTS the op via the existing operation-failed contract
 * ({ operationId, retryable: true }) so the client queue drains and retries rather than wedging.
 * Buckets are torn down on disconnect (see {@link cleanupRateLimiter}).
 */

export type RateLimitKind = 'loose' | 'tight'

interface BucketConfig {
  /** Maximum tokens the bucket can hold (burst allowance). */
  capacity: number
  /** Tokens replenished per second (sustained allowance). */
  refillPerSec: number
}

// Generous: keep live drags + read-only viewers smooth. ~60fps drag = 60 ops/s < 100/s refill,
// and 200 burst tokens cover several seconds of continuous dragging.
export const LOOSE_CONFIG: BucketConfig = { capacity: 200, refillPerSec: 100 }
// Tighter: structural mutations. 25/s sustained + 50 burst is far above any human editing cadence
// but still bounds a malicious or buggy client hammering the DB.
export const TIGHT_CONFIG: BucketConfig = { capacity: 50, refillPerSec: 25 }

interface Bucket {
  tokens: number
  lastRefill: number
}

interface SocketBuckets {
  loose: Bucket
  tight: Bucket
}

const socketBuckets = new Map<string, SocketBuckets>()

function newBucket(config: BucketConfig, now: number): Bucket {
  return { tokens: config.capacity, lastRefill: now }
}

function refill(bucket: Bucket, config: BucketConfig, now: number): void {
  const elapsed = now - bucket.lastRefill
  if (elapsed <= 0) return
  bucket.tokens = Math.min(config.capacity, bucket.tokens + (elapsed / 1000) * config.refillPerSec)
  bucket.lastRefill = now
}

export interface RateLimitResult {
  allowed: boolean
  /** Estimated time until at least one token is available again (ms). 0 when allowed. */
  retryAfterMs: number
}

/**
 * Classify a workflow operation into the bucket that governs it. Position-only ops (the sole ops a
 * read-only collaborator may emit) go to the LOOSE bucket; everything else is a mutation → TIGHT.
 */
export function classifyOperation(
  operation: string | undefined,
  target: string | undefined
): RateLimitKind {
  if (
    (operation === 'update-position' && target === 'block') ||
    (operation === 'batch-update-positions' && target === 'blocks')
  ) {
    return 'loose'
  }
  return 'tight'
}

/**
 * Attempt to consume one token from the socket's bucket of the given kind. Pure/testable — pass
 * `now` to make time deterministic in tests.
 */
export function consumeToken(
  socketId: string,
  kind: RateLimitKind,
  now: number = Date.now()
): RateLimitResult {
  let buckets = socketBuckets.get(socketId)
  if (!buckets) {
    buckets = { loose: newBucket(LOOSE_CONFIG, now), tight: newBucket(TIGHT_CONFIG, now) }
    socketBuckets.set(socketId, buckets)
  }

  const config = kind === 'loose' ? LOOSE_CONFIG : TIGHT_CONFIG
  const bucket = kind === 'loose' ? buckets.loose : buckets.tight

  refill(bucket, config, now)

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return { allowed: true, retryAfterMs: 0 }
  }

  const deficit = 1 - bucket.tokens
  const retryAfterMs = Math.ceil((deficit / config.refillPerSec) * 1000)
  return { allowed: false, retryAfterMs }
}

/**
 * Guard to invoke at the START of an op handler. Consumes a token; if the bucket is exhausted it
 * REJECTS the op via the existing operation-failed contract (retryable) — never silently dropping a
 * queue-tracked op — and returns false so the caller returns early. Returns true when the op may
 * proceed.
 */
export function enforceRateLimit(
  socket: AuthenticatedSocket,
  kind: RateLimitKind,
  operationId: string | undefined
): boolean {
  const result = consumeToken(socket.id, kind)
  if (result.allowed) return true

  logger.warn(`Rate limit (${kind}) exceeded for socket ${socket.id}`, {
    operationId,
    retryAfterMs: result.retryAfterMs,
  })

  // Reject through the queue's contract so the client backs off and retries instead of wedging.
  // Ops without an operationId are not queue-tracked, so there is nothing to fail — dropping them is
  // safe and cannot wedge the queue.
  if (operationId) {
    socket.emit('operation-failed', {
      operationId,
      error: 'Rate limit exceeded, please retry',
      retryable: true,
    })
  }

  return false
}

/** Remove a socket's buckets on disconnect to prevent unbounded Map growth. */
export function cleanupRateLimiter(socketId: string): void {
  socketBuckets.delete(socketId)
}

/** Test/observability helper: number of sockets currently tracked. */
export function getTrackedSocketCount(): number {
  return socketBuckets.size
}
