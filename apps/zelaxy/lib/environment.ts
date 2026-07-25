/**
 * Environment utility functions for consistent environment detection across the application
 */
import { env, isTruthy } from './env'

/**
 * Is the application running in production mode
 */
export const isProd = env.NODE_ENV === 'production'

/**
 * Is the application running in development mode
 */
export const isDev = env.NODE_ENV === 'development'

/**
 * Is the application running in test mode
 */
export const isTest = env.NODE_ENV === 'test'

/**
 * Is this the hosted version of the application
 */
export const isHosted = env.NEXT_PUBLIC_APP_URL === 'https://www.zelaxy.in'

/**
 * Is billing enforcement enabled.
 *
 * BILLING_ENABLED is a server-only env var (no NEXT_PUBLIC_ prefix), but this
 * flag is also read by client components (sidebar, settings modal, team
 * management, ...) to decide whether to render billing UI at all. Next.js
 * only inlines NEXT_PUBLIC_-prefixed vars into the client bundle, so on the
 * client `env.BILLING_ENABLED` is always undefined - falling back to the
 * NEXT_PUBLIC_BILLING_ENABLED mirror is what makes this actually work in the
 * browser. Set both vars to the same value; NEXT_PUBLIC_BILLING_ENABLED alone
 * (without BILLING_ENABLED) would show the UI without server-side gating.
 */
export const isBillingEnabled =
  isTruthy(env.BILLING_ENABLED) || isTruthy(env.NEXT_PUBLIC_BILLING_ENABLED)

/**
 * Is Single Sign-On (SSO) enabled. On self-hosted deployments this also acts as the
 * bypass for the Enterprise-plan gate (see lib/sso/access.ts).
 */
export const isSsoEnabled = isTruthy(env.SSO_ENABLED)

/**
 * Are organizations enabled. Billing implies organizations; otherwise honor the flag so
 * SSO users can be auto-provisioned into an organization on first sign-in.
 *
 * Same client/server split as isBillingEnabled above - ORGANIZATIONS_ENABLED
 * is server-only, so the NEXT_PUBLIC_ORGANIZATIONS_ENABLED mirror is what
 * client components actually see.
 */
export const isOrganizationsEnabled =
  isBillingEnabled ||
  isTruthy(env.ORGANIZATIONS_ENABLED) ||
  isTruthy(env.NEXT_PUBLIC_ORGANIZATIONS_ENABLED)

/**
 * Get cost multiplier based on environment
 */
export function getCostMultiplier(): number {
  return isProd ? (env.COST_MULTIPLIER ?? 1) : 1
}
