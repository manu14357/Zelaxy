import { beforeEach, describe, expect, it, vi } from 'vitest'

const { state, sendUsageAlertEmailMock, insertMock } = vi.hoisted(() => ({
  state: {
    selectCall: 0,
    statsRow: null as any,
    claimReturning: [] as any[],
    planRow: [{ plan: 'pro' }] as any[],
  },
  sendUsageAlertEmailMock: vi.fn(),
  insertMock: vi.fn(() => ({ values: vi.fn(() => Promise.resolve()) })),
}))

vi.mock('@/db', () => {
  const whereThenable = () => {
    const p = Promise.resolve(undefined)
    return {
      returning: () => Promise.resolve(state.claimReturning),
      then: p.then.bind(p),
      catch: p.catch.bind(p),
      finally: p.finally.bind(p),
    }
  }
  const selectChain = () => {
    const chain: any = {
      from: () => chain,
      where: () => chain,
      limit: () => {
        state.selectCall += 1
        // 1st select = userStats row; any later select = the plan lookup.
        return Promise.resolve(
          state.selectCall === 1 ? (state.statsRow ? [state.statsRow] : []) : state.planRow
        )
      },
    }
    return chain
  }
  return {
    db: {
      select: () => selectChain(),
      update: () => ({ set: () => ({ where: () => whereThenable() }) }),
      insert: insertMock,
    },
  }
})

vi.mock('@/lib/environment', () => ({ isBillingEnabled: true }))
vi.mock('@/lib/billing/emails', () => ({ sendUsageAlertEmail: sendUsageAlertEmailMock }))
vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { checkUsageAlerts, highestUsageBucket } from '@/lib/billing/usage-alerts'

describe('highestUsageBucket', () => {
  it('maps a usage percentage to the highest crossed alert bucket', () => {
    expect(highestUsageBucket(40)).toBe(0)
    expect(highestUsageBucket(50)).toBe(50)
    expect(highestUsageBucket(74)).toBe(50)
    expect(highestUsageBucket(75)).toBe(75)
    expect(highestUsageBucket(80)).toBe(80)
    expect(highestUsageBucket(89)).toBe(80)
    expect(highestUsageBucket(90)).toBe(90)
    expect(highestUsageBucket(99)).toBe(90)
    expect(highestUsageBucket(100)).toBe(100)
    expect(highestUsageBucket(150)).toBe(100)
  })
})

describe('checkUsageAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.selectCall = 0
    state.statsRow = null
    state.claimReturning = []
    state.planRow = [{ plan: 'pro' }]
  })

  it('fires an email + in-app notification the first time a bucket is crossed', async () => {
    state.statsRow = { currentPeriodCost: '6', currentUsageLimit: '10', alertedUsageThreshold: 0 } // 60%
    state.claimReturning = [{ id: 'stats_1' }] // won the claim

    await checkUsageAlerts('user_1')

    expect(insertMock).toHaveBeenCalledTimes(1) // in-app notification row
    expect(sendUsageAlertEmailMock).toHaveBeenCalledWith(
      'user_1',
      expect.objectContaining({ percent: 50, planLabel: 'Pro' })
    )
  })

  it('does NOT re-alert a bucket already alerted this period', async () => {
    state.statsRow = { currentPeriodCost: '6', currentUsageLimit: '10', alertedUsageThreshold: 50 } // 60%, 50 already alerted

    await checkUsageAlerts('user_1')

    expect(sendUsageAlertEmailMock).not.toHaveBeenCalled()
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('does nothing below the first (50%) threshold', async () => {
    state.statsRow = { currentPeriodCost: '4', currentUsageLimit: '10', alertedUsageThreshold: 0 } // 40%

    await checkUsageAlerts('user_1')

    expect(sendUsageAlertEmailMock).not.toHaveBeenCalled()
  })

  it('a jump past several buckets fires ONE alert for the highest crossed', async () => {
    state.statsRow = { currentPeriodCost: '9.5', currentUsageLimit: '10', alertedUsageThreshold: 0 } // 95%
    state.claimReturning = [{ id: 'stats_1' }]

    await checkUsageAlerts('user_1')

    expect(sendUsageAlertEmailMock).toHaveBeenCalledTimes(1)
    expect(sendUsageAlertEmailMock).toHaveBeenCalledWith(
      'user_1',
      expect.objectContaining({ percent: 90 })
    )
  })

  it('does not dispatch if the atomic claim is lost (concurrent execution won)', async () => {
    state.statsRow = { currentPeriodCost: '6', currentUsageLimit: '10', alertedUsageThreshold: 0 }
    state.claimReturning = [] // another caller already claimed this bucket

    await checkUsageAlerts('user_1')

    expect(sendUsageAlertEmailMock).not.toHaveBeenCalled()
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('is a no-op when the plan limit is zero or the user has no stats', async () => {
    state.statsRow = { currentPeriodCost: '5', currentUsageLimit: '0', alertedUsageThreshold: 0 }
    await checkUsageAlerts('user_1')
    expect(sendUsageAlertEmailMock).not.toHaveBeenCalled()

    state.selectCall = 0
    state.statsRow = null
    await checkUsageAlerts('user_2')
    expect(sendUsageAlertEmailMock).not.toHaveBeenCalled()
  })
})
