import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  userStatsRow,
  insertedTransactions,
  transactionMock,
  subscriptionMock,
  createOverageBillingPaymentLinkMock,
  subscriptionRows,
  userRows,
  userEmailRow,
} = vi.hoisted(() => ({
  userStatsRow: { value: null as any },
  insertedTransactions: [] as any[],
  transactionMock: vi.fn(),
  subscriptionMock: vi.fn(),
  createOverageBillingPaymentLinkMock: vi.fn(),
  subscriptionRows: { value: [] as any[] },
  userRows: { value: [] as any[] },
  userEmailRow: { value: null as any },
}))

function makeTx() {
  return {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    for: vi.fn().mockReturnThis(),
    limit: vi.fn(() => Promise.resolve(userStatsRow.value ? [{ ...userStatsRow.value }] : [])),
    update: vi.fn().mockReturnThis(),
    set: vi.fn((values: any) => {
      Object.assign(userStatsRow.value, values)
      return { where: vi.fn().mockResolvedValue(undefined) }
    }),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn((values: any) => {
      insertedTransactions.push(values)
      return Promise.resolve()
    }),
  }
}

transactionMock.mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(makeTx()))

// Dispatches by the shape of the columns object passed to db.select(...) -
// robust to call count/order varying between checkAndSettleThresholdForUser
// (which added a user email/name lookup) and
// getActiveIndividualPaidUserIds's candidate-listing queries, unlike a
// call-index-based dispatch. The chain resolves directly when awaited
// (no .limit()), matching the candidate queries, and also supports
// .limit() for the email/name lookup, which does chain one.
vi.mock('@/db', () => ({
  db: {
    transaction: transactionMock,
    select: vi.fn((columns?: Record<string, unknown>) => {
      const keys = columns ? Object.keys(columns) : []
      let resultRows: any[]
      if (keys.includes('email')) {
        resultRows = userEmailRow.value ? [{ ...userEmailRow.value }] : []
      } else if (keys.includes('referenceId')) {
        resultRows = subscriptionRows.value
      } else {
        resultRows = userRows.value
      }

      const chain: any = {
        from: vi.fn(() => chain),
        where: vi.fn(() => chain),
        limit: vi.fn(() => Promise.resolve(resultRows)),
        then: (resolve: (value: any[]) => any, reject?: (reason: unknown) => any) =>
          Promise.resolve(resultRows).then(resolve, reject),
      }
      return chain
    }),
  },
}))

vi.mock('@/lib/billing/core/subscription', () => ({
  getHighestPrioritySubscription: subscriptionMock,
}))

vi.mock('@/lib/billing/core/billing', () => ({
  getPlanPricing: (plan: string) =>
    ({ pro: { basePrice: 20, minimum: 20 }, team: { basePrice: 40, minimum: 40 } })[plan] ?? {
      basePrice: 0,
      minimum: 0,
    },
}))

vi.mock('@/lib/billing/razorpay/payment-links', () => ({
  createOverageBillingPaymentLink: createOverageBillingPaymentLinkMock,
}))

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import {
  checkAndSettleThresholdForUser,
  DEFAULT_THRESHOLD,
  processThresholdBillingCheck,
  ThresholdSettlementError,
} from '@/lib/billing/threshold-billing'

describe('checkAndSettleThresholdForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    transactionMock.mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(makeTx()))
    userStatsRow.value = null
    insertedTransactions.length = 0
    subscriptionRows.value = []
    userRows.value = []
    userEmailRow.value = null
  })

  it('is a no-op for a free-plan user', async () => {
    subscriptionMock.mockResolvedValue({ plan: 'free', referenceId: 'user_1' })

    const result = await checkAndSettleThresholdForUser('user_1')

    expect(result).toMatchObject({ settled: false, unbilledOverage: 0, chargedAmount: 0 })
    expect(transactionMock).not.toHaveBeenCalled()
  })

  it('is a no-op when the active subscription is organization-referenced (team member)', async () => {
    subscriptionMock.mockResolvedValue({ plan: 'team', referenceId: 'org_1' })

    const result = await checkAndSettleThresholdForUser('user_1')

    expect(result).toMatchObject({ settled: false, unbilledOverage: 0, chargedAmount: 0 })
    expect(transactionMock).not.toHaveBeenCalled()
  })

  it('is a no-op when unbilled overage is under the threshold', async () => {
    subscriptionMock.mockResolvedValue({ plan: 'pro', referenceId: 'user_1' })
    userStatsRow.value = {
      currentPeriodCost: '50',
      billedOverageThisPeriod: '0',
      creditBalance: '0',
    }

    const result = await checkAndSettleThresholdForUser('user_1')

    expect(result).toMatchObject({ settled: false })
    expect(insertedTransactions).toHaveLength(0)
    expect(userStatsRow.value).toMatchObject({ billedOverageThisPeriod: '0', creditBalance: '0' })
  })

  it('settles entirely with credits when the balance fully covers the overage', async () => {
    subscriptionMock.mockResolvedValue({ plan: 'pro', referenceId: 'user_1' })
    userStatsRow.value = {
      currentPeriodCost: '150',
      billedOverageThisPeriod: '0',
      creditBalance: '200',
    }

    const result = await checkAndSettleThresholdForUser('user_1')

    expect(result).toMatchObject({
      settled: true,
      unbilledOverage: 130,
      creditsApplied: 130,
      chargedAmount: 0,
    })
    expect(createOverageBillingPaymentLinkMock).not.toHaveBeenCalled()
    expect(userStatsRow.value).toMatchObject({
      creditBalance: '70',
      billedOverageThisPeriod: '130',
    })
    expect(insertedTransactions[0]).toMatchObject({ type: 'applied_to_charge', amount: '-130' })
  })

  it('applies partial credits then issues a payment link for the remainder', async () => {
    subscriptionMock.mockResolvedValue({ plan: 'pro', referenceId: 'user_1' })
    userStatsRow.value = {
      currentPeriodCost: '150',
      billedOverageThisPeriod: '0',
      creditBalance: '30',
    }
    userEmailRow.value = { email: 'user1@example.com', name: 'User One' }
    createOverageBillingPaymentLinkMock.mockResolvedValue({
      success: true,
      chargedAmount: 100,
      paymentLinkId: 'plink_1',
    })

    const result = await checkAndSettleThresholdForUser('user_1')

    expect(result).toMatchObject({
      settled: true,
      unbilledOverage: 130,
      creditsApplied: 30,
      chargedAmount: 100,
      paymentLinkId: 'plink_1',
    })
    expect(createOverageBillingPaymentLinkMock).toHaveBeenCalledWith(
      'User One',
      'user1@example.com',
      100,
      expect.any(String),
      expect.objectContaining({ zelaxyThresholdSettlement: 'true' }),
      'threshold-user_1-0'
    )
    expect(userStatsRow.value).toMatchObject({ creditBalance: '0', billedOverageThisPeriod: '130' })
  })

  it('respects a custom threshold override', async () => {
    subscriptionMock.mockResolvedValue({ plan: 'pro', referenceId: 'user_1' })
    userStatsRow.value = {
      currentPeriodCost: '70',
      billedOverageThisPeriod: '0',
      creditBalance: '100',
    }

    const result = await checkAndSettleThresholdForUser('user_1', 40)

    expect(result.settled).toBe(true)
    expect(result.unbilledOverage).toBe(50)
  })

  it('compensates (refunds credits, reverts billed amount) when issuing the payment link throws', async () => {
    subscriptionMock.mockResolvedValue({ plan: 'pro', referenceId: 'user_1' })
    userStatsRow.value = {
      currentPeriodCost: '150',
      billedOverageThisPeriod: '0',
      creditBalance: '30',
    }
    userEmailRow.value = { email: 'user1@example.com', name: 'User One' }
    createOverageBillingPaymentLinkMock.mockRejectedValue(new Error('Razorpay unavailable'))

    let caught: unknown
    try {
      await checkAndSettleThresholdForUser('user_1')
    } catch (err) {
      caught = err
    }

    expect(caught).toBeInstanceOf(ThresholdSettlementError)
    expect((caught as ThresholdSettlementError).retryable).toBe(true)
    expect(userStatsRow.value).toMatchObject({ creditBalance: '30', billedOverageThisPeriod: '0' })
    expect(insertedTransactions.map((t) => t.type)).toEqual([
      'applied_to_charge',
      'admin_adjustment',
    ])
  })

  it('compensates and throws retryable when the payment link request reports failure without throwing', async () => {
    subscriptionMock.mockResolvedValue({ plan: 'pro', referenceId: 'user_1' })
    userStatsRow.value = {
      currentPeriodCost: '150',
      billedOverageThisPeriod: '0',
      creditBalance: '30',
    }
    userEmailRow.value = { email: 'user1@example.com', name: 'User One' }
    createOverageBillingPaymentLinkMock.mockResolvedValue({
      success: false,
      error: 'card declined',
    })

    let caught: unknown
    try {
      await checkAndSettleThresholdForUser('user_1')
    } catch (err) {
      caught = err
    }

    expect(caught).toBeInstanceOf(ThresholdSettlementError)
    expect((caught as ThresholdSettlementError).retryable).toBe(true)
    expect((caught as ThresholdSettlementError).message).toContain('card declined')
    expect(userStatsRow.value).toMatchObject({ creditBalance: '30', billedOverageThisPeriod: '0' })
  })

  it('compensates and throws non-retryable when there is no email on file', async () => {
    subscriptionMock.mockResolvedValue({ plan: 'pro', referenceId: 'user_1' })
    userStatsRow.value = {
      currentPeriodCost: '150',
      billedOverageThisPeriod: '0',
      creditBalance: '30',
    }
    userEmailRow.value = null

    let caught: unknown
    try {
      await checkAndSettleThresholdForUser('user_1')
    } catch (err) {
      caught = err
    }

    expect(caught).toBeInstanceOf(ThresholdSettlementError)
    expect((caught as ThresholdSettlementError).retryable).toBe(false)
    expect(createOverageBillingPaymentLinkMock).not.toHaveBeenCalled()
    expect(userStatsRow.value).toMatchObject({ creditBalance: '30', billedOverageThisPeriod: '0' })
  })

  it('throws non-retryable when the user has no userStats row', async () => {
    subscriptionMock.mockResolvedValue({ plan: 'pro', referenceId: 'user_1' })
    userStatsRow.value = null

    let caught: unknown
    try {
      await checkAndSettleThresholdForUser('user_1')
    } catch (err) {
      caught = err
    }

    expect(caught).toBeInstanceOf(ThresholdSettlementError)
    expect((caught as ThresholdSettlementError).retryable).toBe(false)
  })

  it('exposes DEFAULT_THRESHOLD as 100', () => {
    expect(DEFAULT_THRESHOLD).toBe(100)
  })
})

describe('processThresholdBillingCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    transactionMock.mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(makeTx()))
    userStatsRow.value = null
    insertedTransactions.length = 0
    subscriptionRows.value = []
    userRows.value = []
    userEmailRow.value = null
  })

  it('is a no-op when there are no active paid individual users', async () => {
    const result = await processThresholdBillingCheck()

    expect(result).toMatchObject({ success: true, candidateCount: 0, settledCount: 0 })
  })

  it('settles a candidate that crosses the threshold and aggregates the result', async () => {
    subscriptionRows.value = [{ referenceId: 'user_1', plan: 'pro' }]
    userRows.value = [{ id: 'user_1' }]
    subscriptionMock.mockResolvedValue({ plan: 'pro', referenceId: 'user_1' })
    userStatsRow.value = {
      currentPeriodCost: '150',
      billedOverageThisPeriod: '0',
      creditBalance: '200',
    }

    const result = await processThresholdBillingCheck()

    expect(result).toMatchObject({
      success: true,
      candidateCount: 1,
      settledCount: 1,
      totalCharged: 0,
      totalCreditsApplied: 130,
    })
  })

  it('does not count a candidate under the threshold as settled', async () => {
    subscriptionRows.value = [{ referenceId: 'user_1', plan: 'pro' }]
    userRows.value = [{ id: 'user_1' }]
    subscriptionMock.mockResolvedValue({ plan: 'pro', referenceId: 'user_1' })
    userStatsRow.value = {
      currentPeriodCost: '50',
      billedOverageThisPeriod: '0',
      creditBalance: '0',
    }

    const result = await processThresholdBillingCheck()

    expect(result).toMatchObject({ success: true, candidateCount: 1, settledCount: 0 })
  })

  it('records a per-user error without throwing out of the overall check', async () => {
    subscriptionRows.value = [{ referenceId: 'user_1', plan: 'pro' }]
    userRows.value = [{ id: 'user_1' }]
    subscriptionMock.mockResolvedValue({ plan: 'pro', referenceId: 'user_1' })
    userStatsRow.value = null // no userStats row -> checkAndSettleThresholdForUser throws

    const result = await processThresholdBillingCheck()

    expect(result.success).toBe(false)
    expect(result.settledCount).toBe(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('user_1')
  })

  it('respects a custom threshold override for every candidate', async () => {
    subscriptionRows.value = [{ referenceId: 'user_1', plan: 'pro' }]
    userRows.value = [{ id: 'user_1' }]
    subscriptionMock.mockResolvedValue({ plan: 'pro', referenceId: 'user_1' })
    userStatsRow.value = {
      currentPeriodCost: '70',
      billedOverageThisPeriod: '0',
      creditBalance: '100',
    }

    const result = await processThresholdBillingCheck(40)

    expect(result).toMatchObject({ settledCount: 1, totalCreditsApplied: 50 })
  })
})
