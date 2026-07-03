import { and, eq, inArray } from 'drizzle-orm'
import { isEnterprisePlan } from '@/lib/billing/core/subscription'
import { isHosted, isSsoEnabled } from '@/lib/environment'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { member, ssoProvider } from '@/db/schema'

const logger = createLogger('SSOAccess')

/**
 * Is the user an owner or admin of at least one organization?
 * SSO configuration is an organization-admin capability.
 */
export async function isUserOrgAdminOrOwner(userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.userId, userId), inArray(member.role, ['owner', 'admin'])))
    .limit(1)
  return rows.length > 0
}

/**
 * Does the user already own at least one SSO provider record? Used on self-hosted deployments so
 * whoever registered a provider can keep managing it regardless of billing state.
 */
export async function isSSOProviderOwner(userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: ssoProvider.id })
    .from(ssoProvider)
    .where(eq(ssoProvider.userId, userId))
    .limit(1)
  return rows.length > 0
}

/**
 * Can this user configure SSO?
 *
 * - Self-hosted with `SSO_ENABLED=true` bypasses the plan gate entirely (matches the env-var
 *   driven self-hosted setup documented for the feature).
 * - On cloud, SSO is an Enterprise capability restricted to organization owners/admins.
 */
export async function hasSSOAccess(userId: string): Promise<boolean> {
  try {
    // Self-hosted override: SSO_ENABLED unlocks the feature without a billing plan.
    if (isSsoEnabled && !isHosted) return true

    const enterprise = await isEnterprisePlan(userId)
    if (!enterprise) return false

    return await isUserOrgAdminOrOwner(userId)
  } catch (error) {
    logger.error('Error checking SSO access', { error, userId })
    return false
  }
}
