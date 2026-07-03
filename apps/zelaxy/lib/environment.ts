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
 * Is billing enforcement enabled
 */
export const isBillingEnabled = isTruthy(env.BILLING_ENABLED)

/**
 * Is Single Sign-On (SSO) enabled. On self-hosted deployments this also acts as the
 * bypass for the Enterprise-plan gate (see lib/sso/access.ts).
 */
export const isSsoEnabled = isTruthy(env.SSO_ENABLED)

/**
 * Are organizations enabled. Billing implies organizations; otherwise honor the flag so
 * SSO users can be auto-provisioned into an organization on first sign-in.
 */
export const isOrganizationsEnabled = isBillingEnabled || isTruthy(env.ORGANIZATIONS_ENABLED)

/**
 * Get cost multiplier based on environment
 */
export function getCostMultiplier(): number {
  return isProd ? (env.COST_MULTIPLIER ?? 1) : 1
}
