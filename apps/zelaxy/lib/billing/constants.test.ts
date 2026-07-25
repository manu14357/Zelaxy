import { describe, expect, it, vi } from 'vitest'
import { getPlanMinimumCost, isPlanPerSeat } from '@/lib/billing/constants'
import { PLAN_TIER_DEFAULTS } from '@/lib/billing/plan-defaults'

// Env vars unset — this is exactly the scenario that used to produce the bug:
// lib/auth.ts's `?? 20`/`?? 40` fallback still charged $20/$40 at checkout
// while lib/billing/subscriptions/utils.ts's `|| 0` fallback made the
// enforced/displayed usage-limit minimum $0 — two different fallbacks for
// the same unset env var.
vi.mock('@/lib/env', () => ({
  env: {
    FREE_TIER_COST_LIMIT: undefined,
    PRO_TIER_COST_LIMIT: undefined,
    TEAM_TIER_COST_LIMIT: undefined,
    ENTERPRISE_TIER_COST_LIMIT: undefined,
  },
}))

describe('billing constants — plan tier fallbacks', () => {
  it('falls back to the correct $10/$20/$40/$100 minimums when env vars are unset (the $0 bug)', () => {
    expect(getPlanMinimumCost('free')).toBe(10)
    expect(getPlanMinimumCost('pro')).toBe(20)
    expect(getPlanMinimumCost('team')).toBe(40)
    expect(getPlanMinimumCost('enterprise')).toBe(100)
  })

  it('returns the free-tier minimum for null/undefined/unknown plans', () => {
    expect(getPlanMinimumCost(null)).toBe(10)
    expect(getPlanMinimumCost(undefined)).toBe(10)
    expect(getPlanMinimumCost('not-a-real-plan')).toBe(10)
  })

  it('marks team/enterprise as per-seat and pro/free as flat', () => {
    expect(isPlanPerSeat('free')).toBe(false)
    expect(isPlanPerSeat('pro')).toBe(false)
    expect(isPlanPerSeat('team')).toBe(true)
    expect(isPlanPerSeat('enterprise')).toBe(true)
  })
})

describe('plan-defaults — pure, env-independent constants (safe for client components)', () => {
  it('exposes the same default numbers PLAN_TIERS falls back to', () => {
    expect(PLAN_TIER_DEFAULTS.free.defaultMinimumCost).toBe(10)
    expect(PLAN_TIER_DEFAULTS.pro.defaultMinimumCost).toBe(20)
    expect(PLAN_TIER_DEFAULTS.team.defaultMinimumCost).toBe(40)
    expect(PLAN_TIER_DEFAULTS.enterprise.defaultMinimumCost).toBe(100)
  })
})
