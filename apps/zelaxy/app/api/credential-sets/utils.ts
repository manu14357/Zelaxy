import { and, eq } from 'drizzle-orm'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { db } from '@/db'
import { credential, credentialMember } from '@/db/schema'

export type PermissionLevel = 'read' | 'write' | 'admin'

const RANK: Record<PermissionLevel, number> = { read: 1, write: 2, admin: 3 }

/** Returns the stronger of two (possibly null) permission levels. */
export function maxPermission(
  a: PermissionLevel | null,
  b: PermissionLevel | null
): PermissionLevel | null {
  if (!a) return b
  if (!b) return a
  return RANK[a] >= RANK[b] ? a : b
}

/** True when `have` is at least as strong as `need`. */
export function permissionAtLeast(have: PermissionLevel | null, need: PermissionLevel): boolean {
  return !!have && RANK[have] >= RANK[need]
}

export interface CredentialAccess {
  found: boolean
  credential: typeof credential.$inferSelect | null
  /** Effective permission for the user: max(workspace permission, member grant). */
  permission: PermissionLevel | null
}

/**
 * Resolves a user's effective permission on a single credential. A user can reach
 * a credential either through their workspace permission on `credential.workspaceId`
 * or through an explicit per-user `credential_member` grant; the effective level is
 * the stronger of the two.
 */
export async function getCredentialAccess(
  credentialId: string,
  userId: string
): Promise<CredentialAccess> {
  const rows = await db.select().from(credential).where(eq(credential.id, credentialId)).limit(1)

  const record = rows[0]
  if (!record) {
    return { found: false, credential: null, permission: null }
  }

  const workspacePermission = (await getUserEntityPermissions(
    userId,
    'workspace',
    record.workspaceId
  )) as PermissionLevel | null

  const memberRows = await db
    .select({ permission: credentialMember.permission })
    .from(credentialMember)
    .where(
      and(eq(credentialMember.credentialId, credentialId), eq(credentialMember.userId, userId))
    )
    .limit(1)

  const memberPermission = (memberRows[0]?.permission ?? null) as PermissionLevel | null

  return {
    found: true,
    credential: record,
    permission: maxPermission(workspacePermission, memberPermission),
  }
}
