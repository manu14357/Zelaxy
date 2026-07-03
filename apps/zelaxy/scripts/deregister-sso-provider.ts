#!/usr/bin/env bun
/**
 * Remove a Single Sign-On provider.
 *
 * Delete a specific provider owned by a user:
 *   SSO_USER_EMAIL=admin@company.com SSO_PROVIDER_ID=okta \
 *   bun run apps/zelaxy/scripts/deregister-sso-provider.ts
 *
 * Delete ALL providers owned by a user (omit SSO_PROVIDER_ID):
 *   SSO_USER_EMAIL=admin@company.com \
 *   bun run apps/zelaxy/scripts/deregister-sso-provider.ts
 */
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { ssoProvider, user } from '@/db/schema'

async function main() {
  const userEmail = process.env.SSO_USER_EMAIL
  if (!userEmail) {
    console.error('❌ SSO_USER_EMAIL is required')
    process.exit(1)
  }
  const providerId = process.env.SSO_PROVIDER_ID

  const owner = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, userEmail.toLowerCase()))
    .limit(1)
  if (owner.length === 0) {
    console.error(`❌ No user found with email ${userEmail}`)
    process.exit(1)
  }
  const userId = owner[0].id

  const providers = await db
    .select({ providerId: ssoProvider.providerId })
    .from(ssoProvider)
    .where(eq(ssoProvider.userId, userId))

  if (providers.length === 0) {
    console.log('ℹ️  No SSO providers found for this user.')
    process.exit(0)
  }

  if (providerId) {
    await db
      .delete(ssoProvider)
      .where(and(eq(ssoProvider.userId, userId), eq(ssoProvider.providerId, providerId)))
    console.log(`✅ Deleted SSO provider "${providerId}"`)
  } else {
    await db.delete(ssoProvider).where(eq(ssoProvider.userId, userId))
    console.log(`✅ Deleted all ${providers.length} SSO provider(s) for ${userEmail}`)
  }

  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Failed to deregister SSO provider:', error)
  process.exit(1)
})
