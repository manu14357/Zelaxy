import { eq } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { paymentWebhookEvents } from '@/db/schema'

const logger = createLogger('PaymentWebhookIdempotency')

const RESULT_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
// If a "processing" row is older than this, the process that claimed it
// almost certainly crashed mid-handler rather than still being in flight —
// allow a retry instead of blocking on it forever.
const STALE_PROCESSING_MS = 5 * 60 * 1000

type EventStatus = 'processing' | 'succeeded' | 'failed_retryable' | 'failed_terminal'

/**
 * Thrown by a webhook handler to signal "do not retry this event" (e.g. the
 * event payload is malformed, or the referenced entity no longer exists) —
 * distinct from a transient failure (Razorpay API hiccup, DB connection drop)
 * that a future redelivery might succeed at.
 */
export class TerminalWebhookError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown
  ) {
    super(message)
    this.name = 'TerminalWebhookError'
  }
}

export interface IdempotentWebhookResult<T> {
  result: T
  /** true if this event id was already processed and the cached result was returned without re-running the handler */
  replayed: boolean
}

/**
 * Thrown when another concurrent request is already processing this exact
 * event id. The caller should let Razorpay's own retry/backoff redeliver it —
 * do not treat this as a permanent failure.
 */
export class WebhookInFlightError extends Error {
  constructor(eventId: string) {
    super(`Webhook event ${eventId} is already being processed by another request`)
    this.name = 'WebhookInFlightError'
  }
}

/**
 * Runs `handler` for a Razorpay event exactly once, using a Postgres row
 * (keyed by the Razorpay event id) as the dedup claim. Razorpay delivers
 * webhooks at-least-once, so every money-mutating handler must be wrapped in
 * this — without it, a retried delivery would double-charge a customer,
 * double-reset a billing period, etc.
 *
 * Deliberately Postgres, not Redis or an in-memory cache: the claim survives
 * a process restart or deploy, and lands in the same database as the money
 * mutation itself.
 *
 * The row claim is a short, separate transaction from `handler()` itself —
 * `handler` typically calls the Razorpay API (network I/O), and holding a
 * Postgres transaction open across a slow external call is its own hazard
 * (lock contention, transaction timeouts). The guarantee this provides is
 * "handler() runs for a given event id at most once concurrently, and at
 * most once successfully" — not "the claim and the handler's side effects
 * commit atomically as a single DB transaction."
 */
export async function withPaymentWebhookIdempotency<T>(
  eventId: string,
  eventType: string,
  handler: () => Promise<T>
): Promise<IdempotentWebhookResult<T>> {
  const claim = await claimEvent(eventId, eventType)

  if (claim.outcome === 'replay') {
    logger.info('Replaying cached result for already-processed webhook event', {
      eventId,
      eventType,
    })
    return { result: claim.result as T, replayed: true }
  }

  if (claim.outcome === 'in-flight') {
    throw new WebhookInFlightError(eventId)
  }

  if (claim.outcome === 'terminal') {
    logger.warn('Webhook event previously failed terminally, not retrying', { eventId, eventType })
    throw new TerminalWebhookError(claim.error || 'Previously failed terminally')
  }

  // claim.outcome === 'claimed' — we own this event id, run the handler.
  try {
    const result = await handler()
    await markSucceeded(eventId, result)
    return { result, replayed: false }
  } catch (error) {
    const isTerminal = error instanceof TerminalWebhookError
    await markFailed(eventId, error, isTerminal)
    throw error
  }
}

type ClaimOutcome =
  | { outcome: 'claimed' }
  | { outcome: 'replay'; result: unknown }
  | { outcome: 'in-flight' }
  | { outcome: 'terminal'; error: string | null }

async function claimEvent(eventId: string, eventType: string): Promise<ClaimOutcome> {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(paymentWebhookEvents)
      .where(eq(paymentWebhookEvents.id, eventId))
      .for('update')
      .limit(1)

    const now = new Date()

    if (existing.length === 0) {
      await tx.insert(paymentWebhookEvents).values({
        id: eventId,
        eventType,
        status: 'processing',
        createdAt: now,
      })
      return { outcome: 'claimed' }
    }

    const row = existing[0]

    if (row.status === 'succeeded') {
      const age = row.completedAt
        ? now.getTime() - row.completedAt.getTime()
        : Number.POSITIVE_INFINITY
      if (age < RESULT_TTL_MS) {
        return { outcome: 'replay', result: row.result }
      }
      // Past the result TTL — treat as a fresh claim (rare: a very old redelivery).
    } else if (row.status === 'processing') {
      const age = now.getTime() - row.createdAt.getTime()
      if (age < STALE_PROCESSING_MS) {
        return { outcome: 'in-flight' }
      }
      // Stale claim — the previous attempt likely crashed; take it over below.
    } else if (row.status === 'failed_terminal') {
      return { outcome: 'terminal', error: row.error }
    }
    // status === 'failed_retryable', or a stale 'processing'/'succeeded' row — reclaim it.

    await tx
      .update(paymentWebhookEvents)
      .set({
        eventType,
        status: 'processing' satisfies EventStatus,
        result: null,
        error: null,
        createdAt: now,
        completedAt: null,
      })
      .where(eq(paymentWebhookEvents.id, eventId))

    return { outcome: 'claimed' }
  })
}

async function markSucceeded(eventId: string, result: unknown): Promise<void> {
  await db
    .update(paymentWebhookEvents)
    .set({
      status: 'succeeded' satisfies EventStatus,
      result: result === undefined ? null : (result as any),
      completedAt: new Date(),
    })
    .where(eq(paymentWebhookEvents.id, eventId))
}

async function markFailed(eventId: string, error: unknown, isTerminal: boolean): Promise<void> {
  await db
    .update(paymentWebhookEvents)
    .set({
      status: (isTerminal ? 'failed_terminal' : 'failed_retryable') satisfies EventStatus,
      error: error instanceof Error ? error.message : String(error),
      completedAt: new Date(),
    })
    .where(eq(paymentWebhookEvents.id, eventId))
}
