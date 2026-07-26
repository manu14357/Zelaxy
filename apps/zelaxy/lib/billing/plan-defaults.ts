/**
 * Pure plan-tier default constants — no `env` import, safe for client components.
 *
 * lib/billing/constants.ts builds on these to produce the env-resolved
 * PLAN_TIERS table (server-only, since it reads @/lib/env). UI components
 * that just need the default dollar amounts to render pricing copy should
 * import from here instead, so they never pull server env config into the
 * client bundle.
 */

export const PLAN_TIER_NAMES = ['free', 'pro', 'team', 'enterprise'] as const
export type PlanTierName = (typeof PLAN_TIER_NAMES)[number]

export const DEFAULT_FREE_CREDITS = 10
export const DEFAULT_PRO_TIER_COST_LIMIT = 20
export const DEFAULT_TEAM_TIER_COST_LIMIT = 40
export const DEFAULT_ENTERPRISE_TIER_COST_LIMIT = 100

export interface PlanTierConfig {
  /** Display name shown in pricing UI */
  label: string
  /** Default minimum $ charged/enforced — per-seat for team/enterprise, flat for pro */
  defaultMinimumCost: number
  /** Whether minimumCost is multiplied by seat count */
  perSeat: boolean
}

export const PLAN_TIER_DEFAULTS: Record<PlanTierName, PlanTierConfig> = {
  free: { label: 'Free', defaultMinimumCost: DEFAULT_FREE_CREDITS, perSeat: false },
  pro: { label: 'Pro', defaultMinimumCost: DEFAULT_PRO_TIER_COST_LIMIT, perSeat: false },
  team: { label: 'Team', defaultMinimumCost: DEFAULT_TEAM_TIER_COST_LIMIT, perSeat: true },
  enterprise: {
    label: 'Enterprise',
    defaultMinimumCost: DEFAULT_ENTERPRISE_TIER_COST_LIMIT,
    perSeat: true,
  },
}

export function isPlanTierName(plan: string): plan is PlanTierName {
  return (PLAN_TIER_NAMES as readonly string[]).includes(plan)
}

export interface PlanFeatureLimits {
  sharingEnabled: boolean
  multiplayerEnabled: boolean
  workspaceCollaborationEnabled: boolean
}

// Static plan -> feature-flag mapping. Previously looked up indirectly via
// the better-auth Stripe plugin's `subscription.plans[].limits` config
// (fetched through a client.subscription.list() round-trip); now that
// Razorpay doesn't have an equivalent plugin, this is just a plain lookup
// table keyed by plan name - same behavior, no network round-trip needed.
export const PLAN_FEATURE_LIMITS: Record<PlanTierName, PlanFeatureLimits> = {
  free: { sharingEnabled: false, multiplayerEnabled: false, workspaceCollaborationEnabled: false },
  pro: { sharingEnabled: true, multiplayerEnabled: false, workspaceCollaborationEnabled: false },
  team: { sharingEnabled: true, multiplayerEnabled: true, workspaceCollaborationEnabled: true },
  enterprise: {
    sharingEnabled: true,
    multiplayerEnabled: true,
    workspaceCollaborationEnabled: true,
  },
}
