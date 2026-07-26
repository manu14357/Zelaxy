import { beforeEach, describe, expect, it, vi } from 'vitest'

const { statsRows } = vi.hoisted(() => ({ statsRows: { value: [] as any[] } }))

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn(() => Promise.resolve(statsRows.value)),
  },
}))

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

vi.mock('@/lib/billing/core/usage', () => ({
  getUserUsageLimit: vi.fn().mockResolvedValue(20),
}))

vi.mock('@/lib/environment', () => ({
  isBillingEnabled: true,
}))

import {
  checkServerSideUsageLimits,
  checkUsageStatus,
} from '@/lib/billing/calculations/usage-monitor'

describe('checkUsageStatus — billingBlocked', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    statsRows.value = []
  })

  it('is not exceeded/blocked for a normal user under their limit', async () => {
    statsRows.value = [{ currentPeriodCost: '5', totalCost: '5', billingBlocked: false }]

    const result = await checkUsageStatus('user_1')

    expect(result.isExceeded).toBe(false)
    expect(result.isBillingBlocked).toBe(false)
  })

  it('reports isExceeded and isBillingBlocked when billingBlocked is set, even under the usage limit', async () => {
    statsRows.value = [{ currentPeriodCost: '2', totalCost: '2', billingBlocked: true }]

    const result = await checkUsageStatus('user_1')

    expect(result.isBillingBlocked).toBe(true)
    // Gates the same way isExceeded already does, so no caller needs a new check.
    expect(result.isExceeded).toBe(true)
  })
})

describe('checkServerSideUsageLimits — billingBlocked message', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    statsRows.value = []
  })

  it('surfaces a payment-specific message, not the generic "upgrade your plan" one', async () => {
    statsRows.value = [{ currentPeriodCost: '2', totalCost: '2', billingBlocked: true }]

    const result = await checkServerSideUsageLimits('user_1')

    expect(result.isExceeded).toBe(true)
    expect(result.isBillingBlocked).toBe(true)
    expect(result.message).toMatch(/payment/i)
    expect(result.message).not.toMatch(/upgrade your plan/i)
  })

  it('surfaces the generic usage-limit message for ordinary overage', async () => {
    statsRows.value = [{ currentPeriodCost: '25', totalCost: '25', billingBlocked: false }]

    const result = await checkServerSideUsageLimits('user_1')

    expect(result.isExceeded).toBe(true)
    expect(result.isBillingBlocked).toBe(false)
    expect(result.message).toMatch(/upgrade your plan/i)
  })
})
