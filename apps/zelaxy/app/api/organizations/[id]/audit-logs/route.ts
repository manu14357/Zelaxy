import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { type AuditAction, type AuditEntityType, queryAuditLogs } from '@/lib/audit/service'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { member } from '@/db/schema'

const logger = createLogger('AuditLogAPI')

export const dynamic = 'force-dynamic'

/**
 * GET /api/organizations/[id]/audit-logs
 * Query audit logs for an organization. Admin/owner only.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId } = await params
    const url = new URL(request.url)

    // Verify user is admin/owner of this organization
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
        { error: 'Forbidden - Admin access required to view audit logs' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const limit = Math.min(Number.parseInt(url.searchParams.get('limit') || '50', 10), 100)
    const offset = Number.parseInt(url.searchParams.get('offset') || '0', 10)
    const action = url.searchParams.get('action') as AuditAction | null
    const entityType = url.searchParams.get('entityType') as AuditEntityType | null
    const entityId = url.searchParams.get('entityId')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    const result = await queryAuditLogs({
      organizationId,
      action: action || undefined,
      entityType: entityType || undefined,
      entityId: entityId || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      data: result.entries,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      },
    })
  } catch (error) {
    logger.error('Failed to query audit logs', {
      organizationId: (await params).id,
      error,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
