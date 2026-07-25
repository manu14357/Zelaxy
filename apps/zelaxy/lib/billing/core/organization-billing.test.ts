import { beforeEach, describe, expect, it, vi } from 'vitest'

const { statsRows, updateCalls } = vi.hoisted(() => ({
  statsRows: { value: [] as any[] },
  updateCalls: [] as any[],
}))

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(() => Promise.resolve(statsRows.value)),
    update: vi.fn(() => ({
      set: vi.fn((values: any) => {
        updateCalls.push(values)
        return { where: vi.fn().mockResolvedValue(undefined) }
      }),
    })),
  },
}))

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { accumulateDepartedMemberUsage } from '@/lib/billing/core/organization-billing'

describe('accumulateDepartedMemberUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    statsRows.value = []
    updateCalls.length = 0
  })

  it('adds the departing member current-period cost to the org total', async () => {
    statsRows.value = [{ currentPeriodCost: '12.50' }]

    await accumulateDepartedMemberUsage('org_1', 'user_1')

    expect(updateCalls).toHaveLength(1)
  })

  it('does nothing (no DB write) when the departing member has zero usage', async () => {
    statsRows.value = [{ currentPeriodCost: '0' }]

    await accumulateDepartedMemberUsage('org_1', 'user_1')

    expect(updateCalls).toHaveLength(0)
  })

  it('does nothing when the member has no userStats row at all', async () => {
    statsRows.value = []

    await accumulateDepartedMemberUsage('org_1', 'user_1')

    expect(updateCalls).toHaveLength(0)
  })

  it('does not throw if the DB write fails (member removal must still proceed)', async () => {
    statsRows.value = [{ currentPeriodCost: '5' }]
    const { db } = await import('@/db')
    ;(db.update as any).mockImplementationOnce(() => {
      throw new Error('DB down')
    })

    await expect(accumulateDepartedMemberUsage('org_1', 'user_1')).resolves.toBeUndefined()
  })
})
