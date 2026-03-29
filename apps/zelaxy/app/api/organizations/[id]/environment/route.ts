import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { extractRequestContext, recordAuditLog } from '@/lib/audit/service'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { decryptSecret, encryptSecret } from '@/lib/utils'
import { db } from '@/db'
import { member, orgEnvironment } from '@/db/schema'

const logger = createLogger('OrgEnvironmentAPI')

export const dynamic = 'force-dynamic'

const EnvVarSchema = z.object({
  variables: z.record(z.string()),
})

/**
 * GET /api/organizations/[id]/environment
 * Get organization-level environment variables. Any org member can read.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId } = await params

    // Verify user is a member of this organization
    const memberEntry = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, organizationId), eq(member.userId, session.user.id)))
      .limit(1)

    if (memberEntry.length === 0) {
      return NextResponse.json(
        { error: 'Forbidden - Not a member of this organization' },
        { status: 403 }
      )
    }

    const result = await db
      .select()
      .from(orgEnvironment)
      .where(eq(orgEnvironment.organizationId, organizationId))
      .limit(1)

    if (!result.length || !result[0].variables) {
      return NextResponse.json({ data: {} }, { status: 200 })
    }

    // Decrypt the variables
    const encryptedVariables = result[0].variables as Record<string, string>
    const decryptedVariables: Record<string, { key: string; value: string }> = {}

    for (const [key, encryptedValue] of Object.entries(encryptedVariables)) {
      try {
        const { decrypted } = await decryptSecret(encryptedValue)
        decryptedVariables[key] = { key, value: decrypted }
      } catch (error) {
        logger.error(`Error decrypting org variable ${key}`, error)
        decryptedVariables[key] = { key, value: '' }
      }
    }

    return NextResponse.json({
      data: decryptedVariables,
      updatedAt: result[0].updatedAt,
      updatedBy: result[0].updatedBy,
    })
  } catch (error) {
    logger.error('Failed to get org environment', {
      organizationId: (await params).id,
      error,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/organizations/[id]/environment
 * Update organization-level environment variables. Admin/owner only.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId } = await params

    // Verify user is admin/owner
    const memberEntry = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, organizationId), eq(member.userId, session.user.id)))
      .limit(1)

    if (memberEntry.length === 0) {
      return NextResponse.json(
        { error: 'Forbidden - Not a member of this organization' },
        { status: 403 }
      )
    }

    if (!['owner', 'admin'].includes(memberEntry[0].role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required to update organization environment' },
        { status: 403 }
      )
    }

    const body = await request.json()

    try {
      const { variables } = EnvVarSchema.parse(body)

      // Encrypt all variables
      const encryptedVariables = await Object.entries(variables).reduce(
        async (accPromise, [key, value]) => {
          const acc = await accPromise
          const { encrypted } = await encryptSecret(value)
          return { ...acc, [key]: encrypted }
        },
        Promise.resolve({} as Record<string, string>)
      )

      // Upsert org environment variables
      await db
        .insert(orgEnvironment)
        .values({
          id: crypto.randomUUID(),
          organizationId,
          variables: encryptedVariables,
          updatedAt: new Date(),
          updatedBy: session.user.id,
        })
        .onConflictDoUpdate({
          target: [orgEnvironment.organizationId],
          set: {
            variables: encryptedVariables,
            updatedAt: new Date(),
            updatedBy: session.user.id,
          },
        })

      logger.info('Organization environment variables updated', {
        organizationId,
        updatedBy: session.user.id,
        variableCount: Object.keys(variables).length,
      })

      // Audit log
      const { ipAddress, userAgent } = extractRequestContext(request)
      recordAuditLog({
        userId: session.user.id,
        organizationId,
        action: 'org_environment.updated',
        entityType: 'environment',
        entityId: organizationId,
        metadata: {
          variableKeys: Object.keys(variables), // Log keys only, not values
        },
        ipAddress,
        userAgent,
      })

      return NextResponse.json({ success: true })
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validationError.errors },
          { status: 400 }
        )
      }
      throw validationError
    }
  } catch (error) {
    logger.error('Failed to update org environment', {
      organizationId: (await params).id,
      error,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
