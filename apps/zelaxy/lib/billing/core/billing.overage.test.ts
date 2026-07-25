import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  selectCallIndex,
  userRow,
  userStatsRow,
  updateSetCalls,
  getHighestPrioritySubscriptionMock,
  getUserUsageDataMock,
  deductAvailableCreditsMock,
  adjustCreditBalanceMock,
  resetUserBillingPeriodMock,
  createOverageBillingPaymentLinkMock,
} = vi.hoisted(() => ({
  selectCallIndex: { value: 0 },
  userRow: {
    value: { id: 'user_1', email: 'user1@example.com', name: 'User One' } as any,
  },
  userStatsRow: { value: { billedOverageThisPeriod: '0' } },
  updateSetCalls: [] as any[],
  getHighestPrioritySubscriptionMock: vi.fn(),
  getUserUsageDataMock: vi.fn(),
  deductAvailableCreditsMock: vi.fn(),
  adjustCreditBalanceMock: vi.fn(),
  resetUserBillingPeriodMock: vi.fn().mockResolvedValue(undefined),
  createOverageBillingPaymentLinkMock: vi.fn(),
}))

// Every db.select() call in the paths under test targets either `user` or
// `userStats`. calculateUserOverage always issues the 1st select (from
// user), processUserOverageBilling's own billedOverageThisPeriod lookup
// always issues the 2nd (from userStats), and its email/name lookup issues
// the 3rd (from user again) - that ordering is invariant across every
// branch tested here.
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => {
      const idx = selectCallIndex.value++
      const isUserStatsCall = idx === 1
      const chain = {
        from: vi.fn(() => chain),
        where: vi.fn(() => chain),
        limit: vi.fn(() =>
          Promise.resolve(isUserStatsCall ? [{ ...userStatsRow.value }] : [{ ...userRow.value }])
        ),
      }
      return chain
    }),
    update: vi.fn(() => ({
      set: vi.fn((values: any) => {
        updateSetCalls.push(values)
        return { where: vi.fn().mockResolvedValue(undefined) }
      }),
    })),
  },
}))

vi.mock('@/lib/billing/core/subscription', () => ({
  getHighestPrioritySubscription: getHighestPrioritySubscriptionMock,
}))

vi.mock('@/lib/billing/core/usage', () => ({
  getUserUsageData: getUserUsageDataMock,
}))

vi.mock('@/lib/billing/core/billing-periods', () => ({
  resetUserBillingPeriod: resetUserBillingPeriodMock,
  resetOrganizationBillingPeriod: vi.fn(),
}))

vi.mock('@/lib/billing/credits/balance', () => ({
  deductAvailableCredits: deductAvailableCreditsMock,
  adjustCreditBalance: adjustCreditBalanceMock,
}))

vi.mock('@/lib/billing/razorpay/payment-links', () => ({
  createOverageBillingPaymentLink: createOverageBillingPaymentLinkMock,
}))

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { processUserOverageBilling } from '@/lib/billing/core/billing'

describe('processUserOverageBilling - credits-before-payment-link wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    selectCallIndex.value = 0
    updateSetCalls.length = 0
    userRow.value = { id: 'user_1', email: 'user1@example.com', name: 'User One' }
    userStatsRow.value = { billedOverageThisPeriod: '0' }
    getHighestPrioritySubscriptionMock.mockResolvedValue({ plan: 'pro' })
  })

  it('is fully covered by a prior threshold settlement - no credits, no payment link', async () => {
    getUserUsageDataMock.mockResolvedValue({ currentUsage: 50 }) // basePrice(pro)=20 -> overage=30
    userStatsRow.value = { billedOverageThisPeriod: '30' } // already fully billed mid-cycle

    const result = await processUserOverageBilling('user_1')

    expect(result).toMatchObject({ success: true, chargedAmount: 0 })
    expect(deductAvailableCreditsMock).not.toHaveBeenCalled()
    expect(createOverageBillingPaymentLinkMock).not.toHaveBeenCalled()
    expect(resetUserBillingPeriodMock).toHaveBeenCalledWith('user_1')
  })

  it('settles unbilled overage entirely with credits - no payment link', async () => {
    getUserUsageDataMock.mockResolvedValue({ currentUsage: 120 }) // overage = 100
    deductAvailableCreditsMock.mockResolvedValue({
      creditsApplied: 100,
      remainingAmount: 0,
      newBalance: 0,
    })

    const result = await processUserOverageBilling('user_1')

    expect(deductAvailableCreditsMock).toHaveBeenCalledWith(
      'user_1',
      100,
      expect.objectContaining({ description: expect.any(String) })
    )
    expect(result).toMatchObject({ success: true, chargedAmount: 0 })
    expect(createOverageBillingPaymentLinkMock).not.toHaveBeenCalled()
    expect(updateSetCalls[0]).toHaveProperty('billedOverageThisPeriod')
    expect(resetUserBillingPeriodMock).toHaveBeenCalledWith('user_1')
  })

  it('applies partial credits then issues a payment link for the remainder', async () => {
    getUserUsageDataMock.mockResolvedValue({ currentUsage: 150 }) // overage = 130
    deductAvailableCreditsMock.mockResolvedValue({
      creditsApplied: 30,
      remainingAmount: 100,
      newBalance: 0,
    })
    createOverageBillingPaymentLinkMock.mockResolvedValue({
      success: true,
      chargedAmount: 100,
      paymentLinkId: 'plink_1',
    })

    const result = await processUserOverageBilling('user_1')

    expect(result).toMatchObject({ success: true, chargedAmount: 100, paymentLinkId: 'plink_1' })
    expect(createOverageBillingPaymentLinkMock).toHaveBeenCalledWith(
      'User One',
      'user1@example.com',
      100,
      expect.any(String),
      expect.objectContaining({ zelaxyUserId: 'user_1' }),
      expect.any(String)
    )
    expect(adjustCreditBalanceMock).not.toHaveBeenCalled()
    expect(resetUserBillingPeriodMock).toHaveBeenCalledWith('user_1')
  })

  it('refunds credits when issuing the payment link fails', async () => {
    getUserUsageDataMock.mockResolvedValue({ currentUsage: 150 }) // overage = 130
    deductAvailableCreditsMock.mockResolvedValue({
      creditsApplied: 30,
      remainingAmount: 100,
      newBalance: 0,
    })
    createOverageBillingPaymentLinkMock.mockResolvedValue({
      success: false,
      error: 'card declined',
    })

    const result = await processUserOverageBilling('user_1')

    expect(result.success).toBe(false)
    expect(adjustCreditBalanceMock).toHaveBeenCalledWith(
      'user_1',
      30,
      'admin_adjustment',
      expect.objectContaining({ description: expect.any(String) })
    )
    expect(resetUserBillingPeriodMock).not.toHaveBeenCalled()
  })

  it('refunds credits when there is no email on file', async () => {
    getUserUsageDataMock.mockResolvedValue({ currentUsage: 150 }) // overage = 130
    userRow.value = { id: 'user_1', email: null, name: 'User One' }
    deductAvailableCreditsMock.mockResolvedValue({
      creditsApplied: 30,
      remainingAmount: 100,
      newBalance: 0,
    })

    const result = await processUserOverageBilling('user_1')

    expect(result).toMatchObject({ success: false })
    expect(adjustCreditBalanceMock).toHaveBeenCalledWith(
      'user_1',
      30,
      'admin_adjustment',
      expect.any(Object)
    )
    expect(createOverageBillingPaymentLinkMock).not.toHaveBeenCalled()
  })
})
