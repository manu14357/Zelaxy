import {
  DEFAULT_ENTERPRISE_TIER_COST_LIMIT,
  DEFAULT_FREE_CREDITS,
  DEFAULT_PRO_TIER_COST_LIMIT,
  DEFAULT_TEAM_TIER_COST_LIMIT,
  isPlanTierName,
  type PlanTierName,
} from '@/lib/billing/plan-defaults'
import { env } from '@/lib/env'

/**
 * SERVER-ONLY billing constants (imports @/lib/env — do not import this file
 * from a 'use client' component; import lib/billing/plan-defaults.ts instead
 * for the plain default numbers).
 *
 * This is the single source of truth for the env-resolved plan pricing. It
 * used to be fragmented across lib/auth.ts (Stripe plan config, `?? 20`/
 * `?? 40`), lib/billing/subscriptions/utils.ts (the enforced usage-limit
 * minimum, `|| 0`), lib/billing/core/billing.ts's getPlanPricing and
 * lib/billing/core/organization-billing.ts (two more hand-typed
 * `{ pro: 20, team: 40, enterprise: 100 }`-shaped objects) — four places that
 * could each drift independently. Concretely: if PRO_TIER_COST_LIMIT/
 * TEAM_TIER_COST_LIMIT were ever unset, checkout still charged $20/$40
 * (lib/auth.ts's fallback) but the enforced/displayed usage-limit minimum
 * silently became $0 (subscriptions/utils.ts's fallback) — two different
 * fallback constants for the same env var. Every consumer now calls
 * getPlanMinimumCost()/isPlanPerSeat() instead of re-declaring its own
 * fallback.
 */

export { DEFAULT_FREE_CREDITS }

/**
 * Base charge applied to every workflow execution, in USD. Applied regardless of whether the
 * workflow uses AI models. Per the billing docs this is 1 credit = $0.005 per run
 * (1 credit = $0.005; see DOLLARS_PER_CREDIT in providers/models).
 */
export const BASE_EXECUTION_CHARGE = 0.005

export interface PlanTierConfig {
  /** Display name shown in pricing UI */
  label: string
  /** Minimum $ charged/enforced — per-seat for team/enterprise, flat for pro */
  minimumCost: number
  /** Whether minimumCost is multiplied by seat count */
  perSeat: boolean
}

/**
 * The actual root: every other file that needs a plan's dollar minimum
 * (Stripe checkout config, enforced usage-limit minimum, pricing UI copy)
 * reads from this table instead of re-declaring its own fallback constant.
 */
export const PLAN_TIERS: Record<PlanTierName, PlanTierConfig> = {
  free: {
    label: 'Free',
    minimumCost: env.FREE_TIER_COST_LIMIT ?? DEFAULT_FREE_CREDITS,
    perSeat: false,
  },
  pro: {
    label: 'Pro',
    minimumCost: env.PRO_TIER_COST_LIMIT ?? DEFAULT_PRO_TIER_COST_LIMIT,
    perSeat: false,
  },
  team: {
    label: 'Team',
    minimumCost: env.TEAM_TIER_COST_LIMIT ?? DEFAULT_TEAM_TIER_COST_LIMIT,
    perSeat: true,
  },
  enterprise: {
    label: 'Enterprise',
    minimumCost: env.ENTERPRISE_TIER_COST_LIMIT ?? DEFAULT_ENTERPRISE_TIER_COST_LIMIT,
    perSeat: true,
  },
}

/** The minimum $ a plan charges/enforces per unit (per-seat for team/enterprise, flat for pro). */
export function getPlanMinimumCost(plan: string | null | undefined): number {
  if (!plan || !isPlanTierName(plan)) return PLAN_TIERS.free.minimumCost
  return PLAN_TIERS[plan].minimumCost
}

/** Whether the plan's minimumCost should be multiplied by seat count. */
export function isPlanPerSeat(plan: string | null | undefined): boolean {
  if (!plan || !isPlanTierName(plan)) return false
  return PLAN_TIERS[plan].perSeat
}
