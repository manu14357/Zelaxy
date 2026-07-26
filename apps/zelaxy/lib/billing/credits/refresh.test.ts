import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  subscriptionRows,
  userRows,
  statsRowsQueue,
  updateSetCalls,
  insertedTransactions,
  selectCallIndex,
  transactionCallCount,
  transactionFailOnCall,
} = vi.hoisted(() => ({
  subscriptionRows: { value: [] as any[] },
  userRows: { value: [] as any[] },
  statsRowsQueue: { value: [] as any[][] },
  updateSetCalls: [] as any[],
  insertedTransactions: [] as any[],
  selectCallIndex: { value: 0 },
  transactionCallCount: { value: 0 },
  transactionFailOnCall: { value: null as number | null },
}))

function makeTx() {
  return {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    for: vi.fn().mockReturnThis(),
    limit: vi.fn(() => Promise.resolve(statsRowsQueue.value.shift() ?? [])),
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
    transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => {
      transactionCallCount.value++
      if (transactionFailOnCall.value === transactionCallCount.value) {
        throw new Error('DB error')
      }
      return cb(makeTx())
    }),
    select: vi.fn(() => {
      const callIndex = selectCallIndex.value++
      const chain = {
        from: vi.fn(() => chain),
        where: vi.fn(() =>
          Promise.resolve(callIndex === 0 ? subscriptionRows.value : userRows.value)
        ),
      }
      return chain
    }),
  },
}))

vi.mock('@/lib/billing/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/billing/constants')>()
  return {
    ...actual,
    getPlanMinimumCost: (plan: string | null | undefined) =>
      ({ pro: 20, team: 40, enterprise: 100 })[plan as string] ?? 0,
  }
})

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { processDailyCreditRefresh } from '@/lib/billing/credits/refresh'

describe('processDailyCreditRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    subscriptionRows.value = []
    userRows.value = []
    statsRowsQueue.value = []
    updateSetCalls.length = 0
    insertedTransactions.length = 0
    selectCallIndex.value = 0
    transactionCallCount.value = 0
    transactionFailOnCall.value = null
  })

  it('tops up an eligible user by 1% of their plan minimum', async () => {
    subscriptionRows.value = [{ referenceId: 'user_1', plan: 'pro' }]
    userRows.value = [{ id: 'user_1' }]
    statsRowsQueue.value = [[{ creditBalance: '5' }]]

    const result = await processDailyCreditRefresh()

    expect(result).toMatchObject({
      success: true,
      processedUsers: 1,
      totalRefreshed: 0.2,
      errors: [],
    })
    expect(updateSetCalls[0]).toMatchObject({ creditBalance: '5.2' })
    expect(insertedTransactions[0]).toMatchObject({
      userId: 'user_1',
      amount: '0.2',
      type: 'daily_refresh',
    })
  })

  it('caps the top-up so the balance never exceeds the plan minimum', async () => {
    subscriptionRows.value = [{ referenceId: 'user_1', plan: 'pro' }]
    userRows.value = [{ id: 'user_1' }]
    statsRowsQueue.value = [[{ creditBalance: '19.9' }]]

    const result = await processDailyCreditRefresh()

    expect(result.totalRefreshed).toBe(0.1)
    expect(updateSetCalls[0]).toMatchObject({ creditBalance: '20' })
  })

  it('does nothing when the balance is already at or above the plan minimum', async () => {
    subscriptionRows.value = [{ referenceId: 'user_1', plan: 'pro' }]
    userRows.value = [{ id: 'user_1' }]
    statsRowsQueue.value = [[{ creditBalance: '20' }]]

    const result = await processDailyCreditRefresh()

    expect(result).toMatchObject({ processedUsers: 0, totalRefreshed: 0 })
    expect(updateSetCalls).toHaveLength(0)
  })

  it('skips free-plan subscriptions', async () => {
    subscriptionRows.value = [{ referenceId: 'user_1', plan: 'free' }]
    userRows.value = []

    const result = await processDailyCreditRefresh()

    expect(result).toMatchObject({ processedUsers: 0, totalRefreshed: 0 })
    expect(updateSetCalls).toHaveLength(0)
  })

  it('skips organization-referenced subscriptions (credits are user-level only)', async () => {
    subscriptionRows.value = [{ referenceId: 'org_1', plan: 'team' }]
    userRows.value = []

    const result = await processDailyCreditRefresh()

    expect(result).toMatchObject({ processedUsers: 0, totalRefreshed: 0 })
  })

  it('continues past a failing user and reports the error', async () => {
    subscriptionRows.value = [
      { referenceId: 'user_1', plan: 'pro' },
      { referenceId: 'user_2', plan: 'pro' },
    ]
    userRows.value = [{ id: 'user_1' }, { id: 'user_2' }]
    statsRowsQueue.value = [[{ creditBalance: '5' }], [{ creditBalance: '5' }]]
    transactionFailOnCall.value = 1

    const result = await processDailyCreditRefresh()

    expect(result.success).toBe(false)
    expect(result.processedUsers).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('user_1')
  })
})
