import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { decryptSecret, encryptSecret } from '@/lib/utils'
import { db } from '@/db'
import { credential } from '@/db/schema'
import { getCredentialAccess, permissionAtLeast } from '../utils'

export const dynamic = 'force-dynamic'

const logger = createLogger('CredentialSetByIdAPI')

const UpdateCredentialSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  value: z.string().optional(),
  config: z.record(z.unknown()).optional(),
})

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

async function decryptConfig(config: Record<string, unknown>): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(config)) {
    if (typeof val === 'string') {
      try {
        const { decrypted } = await decryptSecret(val)
        out[key] = decrypted
      } catch {
        out[key] = ''
      }
    } else {
      out[key] = val
    }
  }
  return out
}

// GET /api/credential-sets/[id] — returns the credential with its decrypted secret
// material. Requires read access (workspace read or a shared grant).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { id } = await params

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const access = await getCredentialAccess(id, session.user.id)
    if (!access.found) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }
    if (!permissionAtLeast(access.permission, 'read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const record = access.credential!
    let value: string | null = null
    if (record.value) {
      try {
        value = (await decryptSecret(record.value)).decrypted
      } catch (error) {
        logger.error(`[${requestId}] Failed to decrypt credential ${id} value`, error)
      }
    }
    const config = record.config
      ? await decryptConfig(record.config as Record<string, unknown>)
      : null

    return NextResponse.json({
      credentialSet: {
        id: record.id,
        workspaceId: record.workspaceId,
        name: record.name,
        type: record.type,
        value,
        config,
        createdBy: record.createdBy,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error fetching credential:`, error)
    return NextResponse.json({ error: 'Failed to fetch credential' }, { status: 500 })
  }
}

// PUT /api/credential-sets/[id] — update name/value/config. Requires write access.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { id } = await params

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const access = await getCredentialAccess(id, session.user.id)
    if (!access.found) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }
    if (!permissionAtLeast(access.permission, 'write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const data = UpdateCredentialSchema.parse(await req.json())

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (data.name !== undefined) updateData.name = data.name
    if (data.value !== undefined) {
      updateData.value = data.value ? (await encryptSecret(data.value)).encrypted : null
    }
    if (data.config !== undefined) {
      updateData.config = data.config ? await encryptConfig(data.config) : null
    }

    try {
      await db.update(credential).set(updateData).where(eq(credential.id, id))
    } catch (_e) {
      return NextResponse.json(
        { error: 'A credential with this name already exists in this workspace' },
        { status: 409 }
      )
    }

    logger.info(`[${requestId}] Credential ${id} updated by ${session.user.id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    logger.error(`[${requestId}] Error updating credential:`, error)
    return NextResponse.json({ error: 'Failed to update credential' }, { status: 500 })
  }
}

// DELETE /api/credential-sets/[id] — remove a credential. Requires write access.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { id } = await params

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const access = await getCredentialAccess(id, session.user.id)
    if (!access.found) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }
    if (!permissionAtLeast(access.permission, 'write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // credential_member rows cascade via the FK onDelete.
    await db.delete(credential).where(eq(credential.id, id))

    logger.info(`[${requestId}] Credential ${id} deleted by ${session.user.id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error(`[${requestId}] Error deleting credential:`, error)
    return NextResponse.json({ error: 'Failed to delete credential' }, { status: 500 })
  }
}
