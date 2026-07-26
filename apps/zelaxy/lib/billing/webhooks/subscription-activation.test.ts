import { beforeEach, describe, expect, it, vi } from 'vitest'

// Exercises the idempotency + correctness guarantees of handleSubscriptionActivated.
// The handler runs at least twice per activation (client verify route + webhook),
// so the once-per-subscription side effects (team-org creation, the prepaid
// credit grant) must fire exactly once; the paying user and the organization
// must never be conflated; and the pre-charge (null period) window must not
// record a (duplicate) invoice.
const {
  state,
  adjustCreditBalanceMock,
  recordInvoiceMock,
  syncUsageMock,
  initPeriodMock,
  insertMock,
  sendPlanReceiptEmailMock,
  sendPlanWelcomeEmailMock,
} = vi.hoisted(() => ({
  state: {
    // What the atomic first-activation UPDATE ... RETURNING yields: a row =
    // "this caller won the claim (first activation)"; [] = "already active".
    claimReturning: [] as any[],
    // FIFO queue of results for each select()...limit() call, in execution order
    // (shared by db.select and tx.select).
    selectResults: [] as any[][],
  },
  adjustCreditBalanceMock: vi.fn(),
  recordInvoiceMock: vi.fn(() => Promise.resolve({ created: true })),
  syncUsageMock: vi.fn(),
  initPeriodMock: vi.fn(),
  insertMock: vi.fn(() => ({ values: vi.fn(() => Promise.resolve()) })),
  sendPlanReceiptEmailMock: vi.fn(),
  sendPlanWelcomeEmailMock: vi.fn(),
}))

vi.mock('@/db', () => {
  // where() is sometimes awaited directly (fire-and-forget updates) and
  // sometimes chained with .returning() (the atomic claim) - so it returns a
  // thenable that also exposes .returning().
  const whereThenable = () => {
    const p = Promise.resolve(undefined)
    return {
      returning: () => Promise.resolve(state.claimReturning),
      then: p.then.bind(p),
      catch: p.catch.bind(p),
      finally: p.finally.bind(p),
    }
  }
  const makeSelectChain = () => {
    const chain: any = {
      from: () => chain,
      where: () => chain,
      for: () => chain,
      limit: () => Promise.resolve(state.selectResults.shift() ?? []),
    }
    return chain
  }
  const updateBuilder = () => ({ set: () => ({ where: () => whereThenable() }) })
  const tx = {
    select: () => makeSelectChain(),
    insert: insertMock,
    update: () => updateBuilder(),
  }
  return {
    db: {
      update: () => updateBuilder(),
      select: () => makeSelectChain(),
      insert: insertMock,
      transaction: async (cb: any) => cb(tx),
    },
  }
})

vi.mock('@/lib/billing', () => ({ syncUsageLimitsFromSubscription: syncUsageMock }))
vi.mock('@/lib/billing/core/billing-periods', () => ({ initializeBillingPeriod: initPeriodMock }))
vi.mock('@/lib/billing/core/billing', () => ({
  processUserOverageBilling: vi.fn(),
  processOrganizationOverageBilling: vi.fn(),
}))
vi.mock('@/lib/billing/credits/balance', () => ({ adjustCreditBalance: adjustCreditBalanceMock }))
vi.mock('@/lib/billing/emails', () => ({
  sendPlanReceiptEmail: sendPlanReceiptEmailMock,
  sendPlanWelcomeEmail: sendPlanWelcomeEmailMock,
}))
vi.mock('@/lib/billing/invoices/ledger', () => ({
  recordInvoice: recordInvoiceMock,
  invoiceIdForOrder: (id: string) => `inv_order_${id}`,
  invoiceIdForSubscription: (id: string, p: Date | null) =>
    `inv_sub_${id}_${p ? Math.floor(p.getTime() / 1000) : 'na'}`,
}))
vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { handleSubscriptionActivated } from '@/lib/billing/webhooks/subscription'

const START = new Date('2026-02-01T00:00:00Z')
const END = new Date('2026-03-01T00:00:00Z')

describe('handleSubscriptionActivated', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.claimReturning = []
    state.selectResults = []
  })

  it('first pro activation: grants prepaid credits once and records a receipt filed under the user', async () => {
    state.claimReturning = [{ id: 'sub_1' }] // wins the claim

    const result = await handleSubscriptionActivated({
      razorpaySubscriptionId: 'sub_1',
      razorpayCustomerId: 'cust_1',
      plan: 'pro',
      referenceId: 'user_1',
      seats: 1,
      currentStart: START,
      currentEnd: END,
    })

    expect(result.isFirstActivation).toBe(true)
    expect(result.referenceId).toBe('user_1')

    expect(adjustCreditBalanceMock).toHaveBeenCalledTimes(1)
    const [uid, amount, type] = adjustCreditBalanceMock.mock.calls[0]
    expect(uid).toBe('user_1')
    expect(amount).toBeGreaterThan(0)
    expect(type).toBe('purchase')

    expect(recordInvoiceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'subscription',
        referenceId: 'user_1',
        userId: 'user_1',
        organizationId: null,
      })
    )

    // Upgrade emails: welcome (first activation) + receipt (money moved).
    expect(sendPlanWelcomeEmailMock).toHaveBeenCalledWith('user_1', { plan: 'pro' })
    expect(sendPlanReceiptEmailMock).toHaveBeenCalledWith(
      'user_1',
      expect.objectContaining({ plan: 'pro', seats: 1 })
    )
  })

  it('renewal delivery: grant is idempotency-keyed on the subscription so it cannot double-apply', async () => {
    state.claimReturning = [] // already active -> not the first activation

    const result = await handleSubscriptionActivated({
      razorpaySubscriptionId: 'sub_1',
      razorpayCustomerId: 'cust_1',
      plan: 'pro',
      referenceId: 'user_1',
      seats: 1,
      currentStart: START,
      currentEnd: END,
    })

    expect(result.isFirstActivation).toBe(false)
    // The grant is no longer gated on isFirstActivation (that was once-or-never
    // and lost the grant on a transient failure). It carries the SAME
    // subscription-scoped key as the first activation, so adjustCreditBalance
    // dedups it (verified in balance.test.ts) - renewals never re-grant.
    expect(adjustCreditBalanceMock).toHaveBeenCalledWith(
      'user_1',
      expect.any(Number),
      'purchase',
      expect.objectContaining({ idempotencyKey: 'activation_sub_1' })
    )
  })

  it('first team activation: creates exactly one org and files the invoice under org + purchasing user', async () => {
    state.claimReturning = [{ id: 'sub_2' }]
    state.selectResults = [
      [], // isOrganizationId(user_2) -> not an org
      [{ referenceId: 'user_2' }], // tx: subscription row (still the user)
      [], // tx: isOrganizationId(user_2) -> not an org
      [{ id: 'user_2', name: 'Bob' }], // tx: user lookup
    ]

    const result = await handleSubscriptionActivated({
      razorpaySubscriptionId: 'sub_2',
      razorpayCustomerId: 'cust_2',
      plan: 'team',
      referenceId: 'user_2',
      seats: 3,
      currentStart: START,
      currentEnd: END,
    })

    expect(result.isFirstActivation).toBe(true)
    expect(result.referenceId).toMatch(/^org_/)
    expect(insertMock).toHaveBeenCalled() // org + member inserted
    // Team credits are org-scoped and unbuilt; no personal credit grant.
    expect(adjustCreditBalanceMock).not.toHaveBeenCalled()

    expect(recordInvoiceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_2', // FK-valid user, never the org id
        organizationId: expect.stringMatching(/^org_/),
        referenceId: expect.stringMatching(/^org_/),
      })
    )
  })

  it('repeat team delivery: reuses the existing org, creating NO duplicate (H2 regression)', async () => {
    state.claimReturning = [] // claim lost -> not first activation
    state.selectResults = [
      [], // isOrganizationId(user_2) -> still not an org (notes carry the user id)
      [{ referenceId: 'org_existing' }], // tx: row already re-pointed to an org
      [{ id: 'org_existing' }], // tx: isOrganizationId(org_existing) -> IS an org
    ]

    const result = await handleSubscriptionActivated({
      razorpaySubscriptionId: 'sub_2',
      razorpayCustomerId: 'cust_2',
      plan: 'team',
      referenceId: 'user_2',
      seats: 3,
      currentStart: START,
      currentEnd: END,
    })

    expect(result.isFirstActivation).toBe(false)
    expect(result.referenceId).toBe('org_existing')
    expect(insertMock).not.toHaveBeenCalled() // NO duplicate org/member
  })

  it('org-direct team management: files the invoice under the org with a VALID user id, never the org id (F1 regression)', async () => {
    state.claimReturning = [{ id: 'sub_3' }]
    state.selectResults = [
      [{ id: 'org_x' }], // isOrganizationId(org_x) -> IS an org
      [{ userId: 'owner_1' }], // getOrganizationOwnerId(org_x)
    ]

    const result = await handleSubscriptionActivated({
      razorpaySubscriptionId: 'sub_3',
      razorpayCustomerId: 'cust_3',
      plan: 'team',
      referenceId: 'org_x', // caller passed an ORGANIZATION id
      seats: 2,
      currentStart: START,
      currentEnd: END,
    })

    expect(result.referenceId).toBe('org_x')
    expect(insertMock).not.toHaveBeenCalled() // org already exists
    expect(recordInvoiceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceId: 'org_x',
        userId: 'owner_1', // the org owner, a real user - satisfies the FK
        organizationId: 'org_x',
      })
    )
  })

  it('pre-charge window (null period, no order): activates but records NO invoice AND grants NO credits (F4 + N1)', async () => {
    state.claimReturning = [{ id: 'sub_4' }]

    const result = await handleSubscriptionActivated({
      razorpaySubscriptionId: 'sub_4',
      razorpayCustomerId: 'cust_4',
      plan: 'pro',
      referenceId: 'user_4',
      seats: 1,
      currentStart: null, // mandate authenticated, first charge not yet settled
      currentEnd: null,
    })

    expect(result.isFirstActivation).toBe(true)
    expect(result.invoiceRecorded).toBe(false)
    expect(recordInvoiceMock).not.toHaveBeenCalled() // no charge -> no invoice/receipt
    // No money has moved yet, so no spendable credits are granted either.
    expect(adjustCreditBalanceMock).not.toHaveBeenCalled()
    // The receipt waits for a real charge; the welcome still fires on activation.
    expect(sendPlanReceiptEmailMock).not.toHaveBeenCalled()
    expect(sendPlanWelcomeEmailMock).toHaveBeenCalledWith('user_4', { plan: 'pro' })
  })
})
