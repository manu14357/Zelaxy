import { beforeEach, describe, expect, it, vi } from 'vitest'

// Documents how usage burns against each plan's budget: percentUsed, the 80%
// warning band, and the 100% exceed point across Free ($10), Pro ($20), and
// Team ($40/seat). The metering budget is USD; 1 credit = $0.005/run, so a
// plan's dollar limit is what accumulates in currentPeriodCost as workflows run.
const { statsRows, limitRef } = vi.hoisted(() => ({
  statsRows: { value: [] as any[] },
  limitRef: { value: 20 },
}))

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn(() => Promise.resolve(statsRows.value)),
  },
}))

vi.mock('@/lib/billing/core/usage', () => ({
  getUserUsageLimit: vi.fn(() => Promise.resolve(limitRef.value)),
}))

vi.mock('@/lib/environment', () => ({ isBillingEnabled: true }))

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { checkUsageStatus } from '@/lib/billing/calculations/usage-monitor'

function statsAt(cost: number) {
  return [{ currentPeriodCost: String(cost), totalCost: String(cost), billingBlocked: false }]
}

describe('plan-tier burn thresholds', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    statsRows.value = []
  })

  it('Free ($10 budget): 40% clear, 80% warns, 100% exceeds', async () => {
    limitRef.value = 10

    statsRows.value = statsAt(4)
    let r = await checkUsageStatus('u')
    expect(r.percentUsed).toBe(40)
    expect(r.isWarning).toBe(false)
    expect(r.isExceeded).toBe(false)

    statsRows.value = statsAt(8)
    r = await checkUsageStatus('u')
    expect(r.percentUsed).toBe(80)
    expect(r.isWarning).toBe(true)
    expect(r.isExceeded).toBe(false)

    statsRows.value = statsAt(10)
    r = await checkUsageStatus('u')
    expect(r.percentUsed).toBe(100)
    expect(r.isExceeded).toBe(true)
  })

  it('Pro ($20 budget): warns at $16 (80%), exceeds at $20', async () => {
    limitRef.value = 20

    statsRows.value = statsAt(16)
    let r = await checkUsageStatus('u')
    expect(r.percentUsed).toBe(80)
    expect(r.isWarning).toBe(true)

    statsRows.value = statsAt(20)
    r = await checkUsageStatus('u')
    expect(r.isExceeded).toBe(true)
  })

  it('Team ($40/seat budget): warns at $32 (80%), exceeds at $40', async () => {
    limitRef.value = 40

    statsRows.value = statsAt(32)
    let r = await checkUsageStatus('u')
    expect(r.percentUsed).toBe(80)
    expect(r.isWarning).toBe(true)

    statsRows.value = statsAt(40)
    r = await checkUsageStatus('u')
    expect(r.isExceeded).toBe(true)
  })

  it('caps the reported percentage at 100 even when usage overshoots the budget', async () => {
    limitRef.value = 10
    statsRows.value = statsAt(25) // 250% of budget -> overage territory
    const r = await checkUsageStatus('u')
    expect(r.percentUsed).toBe(100)
    expect(r.isExceeded).toBe(true)
  })
})
