/**
 * Customer-facing subscription prices actually charged via Razorpay.
 *
 * Deliberately a separate numeric domain from plan-defaults.ts's
 * PLAN_TIER_DEFAULTS, which tracks the internal usage-metering budget (how
 * much AI-provider spend a plan allows before overage kicks in) - that
 * budget is computed from real per-token/per-execution costs and is
 * unrelated to what Razorpay bills the customer. Keeping them separate means
 * repricing or switching payment providers never touches the usage-metering
 * math (calculateUserOverage, checkAndSettleThresholdForUser, etc.), which
 * still reasons in the original unit.
 *
 * No `free` entry - the Free tier isn't a purchasable Razorpay subscription
 * (there's nothing to charge), so it's simply not represented here.
 * Enterprise isn't self-serve (contact sales), so it's not here either.
 * Zero imports, safe for client components.
 */
export const RAZORPAY_PLAN_PRICING = {
  pro: {
    label: 'Pro',
    priceInr: 1999,
    period: '/month',
    perSeat: false,
  },
  team: {
    label: 'Team',
    priceInr: 4999,
    period: '/seat/month',
    perSeat: true,
  },
} as const

export type RazorpaySubscriptionPlan = keyof typeof RAZORPAY_PLAN_PRICING

export function isRazorpaySubscriptionPlan(plan: string): plan is RazorpaySubscriptionPlan {
  return plan === 'pro' || plan === 'team'
}

export function getRazorpaySubscriptionPriceInr(plan: RazorpaySubscriptionPlan): number {
  return RAZORPAY_PLAN_PRICING[plan].priceInr
}

/**
 * Approximate INR-per-credit-unit conversion rate for prepaid credit
 * purchases specifically. userStats.creditBalance is consumed against the
 * usage-metering budget (see the module doc comment above) - a domain that
 * is NOT being converted to INR - but a credit purchase is a real INR
 * payment. Without this conversion, crediting the raw rupee amount 1:1
 * would make every ₹1 paid worth $1 of usage budget, ~83x too generous.
 * This is a static illustrative rate, not a live FX feed - update it (or
 * replace with a real FX source) if precision matters for your deployment.
 */
export const INR_PER_USD_CREDIT = 83

export function convertInrPaymentToCreditUnits(amountRupees: number): number {
  return Math.round((amountRupees / INR_PER_USD_CREDIT) * 100) / 100
}
