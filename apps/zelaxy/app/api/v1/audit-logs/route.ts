import { and, asc, desc, eq, gte, lte } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { auditLog, member } from '@/db/schema'
import {
  checkRateLimit,
  createRateLimitResponse,
} from '@/app/api/v1/middleware'

const logger = createLogger('V1AuditLogsAPI')

export const dynamic = 'force-dynamic'
export const revalidate = 0

const QuerySchema = z.object({
  organizationId: z.string().min(1, 'organizationId is required'),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

/** GET /api/v1/audit-logs — List audit log entries for an organization. */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const rateLimit = await checkRateLimit(request, 'audit-logs')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit)
    }

    const userId = rateLimit.userId!
    const { searchParams } = new URL(request.url)
    const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { organizationId, action, entityType, entityId, startDate, endDate, limit, offset } =
      parsed.data

    // Verify user is a member of the organization
    const [membership] = await db
      .select({ id: member.id, role: member.role })
      .from(member)
      .where(and(eq(member.userId, userId), eq(member.organizationId, organizationId)))
      .limit(1)

    if (!membership) {
      return NextResponse.json(
        { error: 'Organization not found or access denied' },
        { status: 403 }
      )
    }

    // Build filter conditions
    const conditions = [eq(auditLog.organizationId, organizationId)]

    if (action) {
      conditions.push(eq(auditLog.action, action))
    }

    if (entityType) {
      conditions.push(eq(auditLog.entityType, entityType))
    }

    if (entityId) {
      conditions.push(eq(auditLog.entityId, entityId))
    }

    if (startDate) {
      conditions.push(gte(auditLog.createdAt, new Date(startDate)))
    }

    if (endDate) {
      conditions.push(lte(auditLog.createdAt, new Date(endDate)))
    }

    const where = and(...conditions)

    const [logs, countResult] = await Promise.all([
      db
        .select()
        .from(auditLog)
        .where(where)
        .orderBy(desc(auditLog.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: auditLog.id })
        .from(auditLog)
        .where(where),
    ])

    logger.info(`[${requestId}] Fetched ${logs.length} audit logs for org ${organizationId}`)

    return NextResponse.json({
      success: true,
      data: {
        logs: logs.map((l) => ({
          id: l.id,
          userId: l.userId,
          organizationId: l.organizationId,
          action: l.action,
          entityType: l.entityType,
          entityId: l.entityId,
          metadata: l.metadata,
          ipAddress: l.ipAddress,
          userAgent: l.userAgent,
          createdAt: l.createdAt.toISOString(),
        })),
        totalCount: countResult.length,
        limit,
        offset,
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error fetching audit logs`, { error })
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
