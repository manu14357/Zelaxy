import { desc, eq, inArray, or } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { encryptSecret } from '@/lib/utils'
import { db } from '@/db'
import { credential, credentialMember, pendingCredentialDraft } from '@/db/schema'

export const dynamic = 'force-dynamic'

const logger = createLogger('CredentialSetsAPI')

const CredentialTypeSchema = z.enum(['oauth', 'env_workspace', 'env_personal', 'service_account'])

const CreateCredentialSchema = z.object({
  workspaceId: z.string().min(1, 'workspaceId is required'),
  name: z.string().min(1, 'Name is required').max(255),
  type: CredentialTypeSchema,
  // Single secret (env value / service-account key).
  value: z.string().optional(),
  // Structured secret material (oauth token set, etc). String fields are encrypted.
  config: z.record(z.unknown()).optional(),
})

/** Encrypts every top-level string field of a config object, leaving non-strings intact. */
async function encryptConfig(config: Record<string, unknown>): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(config)) {
    if (typeof val === 'string') {
      const { encrypted } = await encryptSecret(val)
      out[key] = encrypted
    } else {
      out[key] = val
    }
  }
  return out
}

// GET /api/credential-sets?workspaceId=... — list credentials the user can see in a
// workspace (requires workspace read). Secret material is never returned.
export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get('workspaceId')
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    const userId = session.user.id
    const workspacePermission = await getUserEntityPermissions(userId, 'workspace', workspaceId)

    // A user without workspace access may still see credentials explicitly shared
    // with them; collect those credential ids up front.
    const sharedRows = await db
      .select({ credentialId: credentialMember.credentialId })
      .from(credentialMember)
      .where(eq(credentialMember.userId, userId))
    const sharedIds = sharedRows.map((r) => r.credentialId)

    if (!workspacePermission && sharedIds.length === 0) {
      logger.warn(`[${requestId}] User ${userId} denied read on workspace ${workspaceId}`)
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const scope = workspacePermission
      ? // Workspace members see all workspace credentials plus anything shared to them.
        sharedIds.length > 0
        ? or(eq(credential.workspaceId, workspaceId), inArray(credential.id, sharedIds))
        : eq(credential.workspaceId, workspaceId)
      : // Non-members only see credentials shared to them (still scoped to this workspace).
        inArray(credential.id, sharedIds)

    const rows = await db
      .select({
        id: credential.id,
        workspaceId: credential.workspaceId,
        name: credential.name,
        type: credential.type,
        createdBy: credential.createdBy,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt,
      })
      .from(credential)
      .where(scope)
      .orderBy(desc(credential.createdAt))

    // Only return credentials actually belonging to the requested workspace.
    const credentialSets = rows.filter((r) => r.workspaceId === workspaceId)

    return NextResponse.json({ credentialSets, total: credentialSets.length })
  } catch (error) {
    logger.error(`[${requestId}] Error fetching credential sets:`, error)
    return NextResponse.json({ error: 'Failed to fetch credential sets' }, { status: 500 })
  }
}

// POST /api/credential-sets — create a credential (requires workspace write). Names
// are unique per workspace; a duplicate returns 409.
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const data = CreateCredentialSchema.parse(body)

    const workspacePermission = await getUserEntityPermissions(
      userId,
      'workspace',
      data.workspaceId
    )
    if (workspacePermission !== 'write' && workspacePermission !== 'admin') {
      logger.warn(`[${requestId}] User ${userId} denied create on workspace ${data.workspaceId}`)
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Reserve the (workspace, name) pair to dedupe concurrent creates. The unique
    // index makes this fail fast if a draft already claimed the name.
    const draftId = crypto.randomUUID()
    try {
      await db.insert(pendingCredentialDraft).values({
        id: draftId,
        workspaceId: data.workspaceId,
        name: data.name,
        type: data.type,
        createdBy: userId,
      })
    } catch (_e) {
      return NextResponse.json(
        { error: 'A credential with this name is already being created' },
        { status: 409 }
      )
    }

    try {
      const encryptedValue = data.value ? (await encryptSecret(data.value)).encrypted : null
      const encryptedConfig = data.config ? await encryptConfig(data.config) : null

      const id = crypto.randomUUID()
      const now = new Date()

      try {
        await db.insert(credential).values({
          id,
          workspaceId: data.workspaceId,
          name: data.name,
          type: data.type,
          value: encryptedValue,
          config: encryptedConfig,
          createdBy: userId,
          createdAt: now,
          updatedAt: now,
        })
      } catch (_e) {
        return NextResponse.json(
          { error: 'A credential with this name already exists in this workspace' },
          { status: 409 }
        )
      }

      logger.info(`[${requestId}] Credential ${id} created in workspace ${data.workspaceId}`)

      return NextResponse.json(
        {
          credentialSet: {
            id,
            workspaceId: data.workspaceId,
            name: data.name,
            type: data.type,
            createdBy: userId,
            createdAt: now,
            updatedAt: now,
          },
        },
        { status: 201 }
      )
    } finally {
      // Always release the reservation; the committed row is the source of truth.
      await db.delete(pendingCredentialDraft).where(eq(pendingCredentialDraft.id, draftId))
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    logger.error(`[${requestId}] Error creating credential:`, error)
    return NextResponse.json({ error: 'Failed to create credential' }, { status: 500 })
  }
}
