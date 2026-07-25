import { beforeEach, describe, expect, it, vi } from 'vitest'

const { statsRows, updateSetCalls, insertedTransactions } = vi.hoisted(() => ({
  statsRows: { value: [] as any[] },
  updateSetCalls: [] as any[],
  insertedTransactions: [] as any[],
}))

function makeTx() {
  return {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    for: vi.fn().mockReturnThis(),
    limit: vi.fn(() => Promise.resolve(statsRows.value)),
    update: vi.fn().mockReturnThis(),
    set: vi.fn((values: any) => {
      updateSetCalls.push(values)
      return { where: vi.fn().mockResolvedValue(undefined) }
    }),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn((values: any) => {
      insertedTransactions.push(values)
      return Promise.resolve()
    }),
  }
}

vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => cb(makeTx())),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(() => Promise.resolve(statsRows.value)),
  },
}))

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import {
  adjustCreditBalance,
  deductAvailableCredits,
  getCreditBalance,
} from '@/lib/billing/credits/balance'

describe('getCreditBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    statsRows.value = []
  })

  it('returns 0 when there is no userStats row', async () => {
    expect(await getCreditBalance('user_1')).toBe(0)
  })

  it('returns the stored balance', async () => {
    statsRows.value = [{ creditBalance: '12.34' }]
    expect(await getCreditBalance('user_1')).toBe(12.34)
  })
})

describe('adjustCreditBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    statsRows.value = []
    updateSetCalls.length = 0
    insertedTransactions.length = 0
  })

  it('adds credits and records a transaction', async () => {
    statsRows.value = [{ creditBalance: '5' }]

    const newBalance = await adjustCreditBalance('user_1', 10, 'purchase')

    expect(newBalance).toBe(15)
    expect(updateSetCalls[0]).toMatchObject({ creditBalance: '15' })
    expect(insertedTransactions[0]).toMatchObject({ amount: '10', type: 'purchase' })
  })

  it('throws instead of allowing the balance to go negative', async () => {
    statsRows.value = [{ creditBalance: '5' }]

    await expect(adjustCreditBalance('user_1', -10, 'admin_adjustment')).rejects.toThrow(/negative/)
  })

  it('throws if the user has no userStats row', async () => {
    statsRows.value = []

    await expect(adjustCreditBalance('user_1', 10, 'purchase')).rejects.toThrow(/No userStats/)
  })
})

describe('deductAvailableCredits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    statsRows.value = []
    updateSetCalls.length = 0
    insertedTransactions.length = 0
  })

  it('covers the full amount when balance is sufficient', async () => {
    statsRows.value = [{ creditBalance: '50' }]

    const result = await deductAvailableCredits('user_1', 20)

    expect(result).toMatchObject({ creditsApplied: 20, remainingAmount: 0, newBalance: 30 })
  })

  it('applies only what is available and reports the remainder to charge', async () => {
    statsRows.value = [{ creditBalance: '15' }]

    const result = await deductAvailableCredits('user_1', 40)

    expect(result).toMatchObject({ creditsApplied: 15, remainingAmount: 25, newBalance: 0 })
  })

  it('applies nothing when the user has zero balance', async () => {
    statsRows.value = [{ creditBalance: '0' }]

    const result = await deductAvailableCredits('user_1', 40)

    expect(result).toMatchObject({ creditsApplied: 0, remainingAmount: 40 })
    expect(updateSetCalls).toHaveLength(0)
  })

  it('is a no-op for a non-positive amount', async () => {
    statsRows.value = [{ creditBalance: '10' }]

    const result = await deductAvailableCredits('user_1', 0)

    expect(result).toMatchObject({ creditsApplied: 0, remainingAmount: 0 })
  })
})
