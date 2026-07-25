import { beforeEach, describe, expect, it, vi } from 'vitest'

// A minimal chainable query-builder mock covering exactly the chains
// idempotency.ts uses: select().from().where().for('update').limit(),
// insert().values(), update().set().where(). `queryState.selectRows`
// controls what the SELECT ... FOR UPDATE resolves to for each test.
const queryState: { selectRows: any[] } = { selectRows: [] }
const inserted: any[] = []
const updated: any[] = []

function makeQueryBuilder() {
  const builder: any = {
    select: vi.fn(() => builder),
    from: vi.fn(() => builder),
    where: vi.fn((...args: any[]) => {
      builder.__lastWhere = args
      return builder
    }),
    for: vi.fn(() => builder),
    limit: vi.fn(() => Promise.resolve(queryState.selectRows)),
    insert: vi.fn(() => builder),
    values: vi.fn((values: any) => {
      inserted.push(values)
      return Promise.resolve()
    }),
    update: vi.fn(() => builder),
    set: vi.fn((values: any) => {
      updated.push(values)
      return builder
    }),
  }
  return builder
}

vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => cb(makeQueryBuilder())),
    update: vi.fn(() => makeQueryBuilder()),
  },
}))

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import {
  TerminalWebhookError,
  WebhookInFlightError,
  withPaymentWebhookIdempotency,
} from '@/lib/billing/webhooks/idempotency'

describe('withPaymentWebhookIdempotency', () => {
  beforeEach(() => {
    queryState.selectRows = []
    inserted.length = 0
    updated.length = 0
    vi.clearAllMocks()
  })

  it('runs the handler and marks the event succeeded on first delivery', async () => {
    queryState.selectRows = [] // no existing row — fresh claim

    const handler = vi.fn().mockResolvedValue({ charged: 42 })
    const { result, replayed } = await withPaymentWebhookIdempotency(
      'evt_1',
      'invoice.payment_succeeded',
      handler
    )

    expect(handler).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ charged: 42 })
    expect(replayed).toBe(false)
    expect(inserted[0]).toMatchObject({ id: 'evt_1', status: 'processing' })
    expect(updated[0]).toMatchObject({ status: 'succeeded' })
  })

  it('replays the cached result without re-running the handler for an already-succeeded event', async () => {
    queryState.selectRows = [
      {
        id: 'evt_2',
        status: 'succeeded',
        result: { charged: 100 },
        completedAt: new Date(), // just now — well within the 7-day TTL
        createdAt: new Date(),
      },
    ]

    const handler = vi.fn().mockResolvedValue({ charged: 999 })
    const { result, replayed } = await withPaymentWebhookIdempotency(
      'evt_2',
      'invoice.paid',
      handler
    )

    expect(handler).not.toHaveBeenCalled()
    expect(replayed).toBe(true)
    expect(result).toEqual({ charged: 100 })
  })

  it('throws WebhookInFlightError instead of double-running a concurrently-processing event', async () => {
    queryState.selectRows = [
      {
        id: 'evt_3',
        status: 'processing',
        result: null,
        completedAt: null,
        createdAt: new Date(), // just claimed — well within the stale threshold
      },
    ]

    const handler = vi.fn()
    await expect(
      withPaymentWebhookIdempotency('evt_3', 'invoice.paid', handler)
    ).rejects.toBeInstanceOf(WebhookInFlightError)
    expect(handler).not.toHaveBeenCalled()
  })

  it('reclaims and retries a stale "processing" row (previous attempt likely crashed)', async () => {
    queryState.selectRows = [
      {
        id: 'evt_4',
        status: 'processing',
        result: null,
        completedAt: null,
        createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago — stale
      },
    ]

    const handler = vi.fn().mockResolvedValue({ ok: true })
    const { replayed } = await withPaymentWebhookIdempotency('evt_4', 'invoice.paid', handler)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(replayed).toBe(false)
  })

  it('does not retry an event marked failed_terminal', async () => {
    queryState.selectRows = [
      {
        id: 'evt_5',
        status: 'failed_terminal',
        result: null,
        error: 'malformed payload',
        completedAt: new Date(),
        createdAt: new Date(),
      },
    ]

    const handler = vi.fn()
    await expect(
      withPaymentWebhookIdempotency('evt_5', 'invoice.paid', handler)
    ).rejects.toBeInstanceOf(TerminalWebhookError)
    expect(handler).not.toHaveBeenCalled()
  })

  it('marks the event failed_retryable (not terminal) when the handler throws a plain error', async () => {
    queryState.selectRows = []
    const handler = vi.fn().mockRejectedValue(new Error('Stripe API timeout'))

    await expect(withPaymentWebhookIdempotency('evt_6', 'invoice.paid', handler)).rejects.toThrow(
      'Stripe API timeout'
    )
    expect(updated[0]).toMatchObject({ status: 'failed_retryable' })
  })

  it('marks the event failed_terminal when the handler throws TerminalWebhookError', async () => {
    queryState.selectRows = []
    const handler = vi.fn().mockRejectedValue(new TerminalWebhookError('bad payload'))

    await expect(
      withPaymentWebhookIdempotency('evt_7', 'invoice.paid', handler)
    ).rejects.toBeInstanceOf(TerminalWebhookError)
    expect(updated[0]).toMatchObject({ status: 'failed_terminal' })
  })
})
