import { and, desc, eq, gte, lte, type SQL } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { auditLog } from '@/db/schema'

const logger = createLogger('AuditLog')

// ============================================================================
// Types
// ============================================================================

export type AuditAction =
  // Organization
  | 'org.created'
  | 'org.updated'
  | 'org.deleted'
  // Members
  | 'member.invited'
  | 'member.removed'
  | 'member.role_updated'
  | 'member.joined'
  // Workspace
  | 'workspace.created'
  | 'workspace.deleted'
  | 'workspace.transferred'
  | 'workspace.linked_to_org'
  // Workflow
  | 'workflow.created'
  | 'workflow.updated'
  | 'workflow.deleted'
  | 'workflow.executed'
  // API Key
  | 'api_key.created'
  | 'api_key.deleted'
  | 'api_key.revoked'
  // Environment
  | 'environment.updated'
  | 'org_environment.updated'
  // Subscription
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'subscription.seats_changed'
  // Invitation
  | 'invitation.sent'
  | 'invitation.accepted'
  | 'invitation.cancelled'
  | 'invitation.expired'
  // Auth
  | 'auth.login'
  | 'auth.logout'
  | 'auth.password_changed'

export type AuditEntityType =
  | 'organization'
  | 'workspace'
  | 'workflow'
  | 'member'
  | 'invitation'
  | 'api_key'
  | 'environment'
  | 'subscription'
  | 'user'

export interface AuditLogEntry {
  userId?: string | null
  organizationId?: string | null
  action: AuditAction
  entityType: AuditEntityType
  entityId?: string | null
  metadata?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
}

export interface AuditLogQueryOptions {
  organizationId?: string
  userId?: string
  action?: AuditAction
  entityType?: AuditEntityType
  entityId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

// ============================================================================
// Service
// ============================================================================

/**
 * Record an audit log entry.
 * Fire-and-forget — errors are logged but never thrown to avoid
 * disrupting the primary operation.
 */
export async function recordAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: entry.userId ?? null,
      organizationId: entry.organizationId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      metadata: entry.metadata ?? null,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
    })
  } catch (error) {
    // Never throw — audit logging must not break the caller
    logger.error('Failed to record audit log entry', {
      action: entry.action,
      entityType: entry.entityType,
      error,
    })
  }
}

/**
 * Query audit log entries with flexible filtering.
 */
export async function queryAuditLogs(options: AuditLogQueryOptions = {}) {
  const { limit = 50, offset = 0 } = options

  const conditions: SQL[] = []

  if (options.organizationId) {
    conditions.push(eq(auditLog.organizationId, options.organizationId))
  }
  if (options.userId) {
    conditions.push(eq(auditLog.userId, options.userId))
  }
  if (options.action) {
    conditions.push(eq(auditLog.action, options.action))
  }
  if (options.entityType) {
    conditions.push(eq(auditLog.entityType, options.entityType))
  }
  if (options.entityId) {
    conditions.push(eq(auditLog.entityId, options.entityId))
  }
  if (options.startDate) {
    conditions.push(gte(auditLog.createdAt, options.startDate))
  }
  if (options.endDate) {
    conditions.push(lte(auditLog.createdAt, options.endDate))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [entries, countResult] = await Promise.all([
    db
      .select()
      .from(auditLog)
      .where(whereClause)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ id: auditLog.id })
      .from(auditLog)
      .where(whereClause)
      .then((rows) => rows.length),
  ])

  return {
    entries,
    total: countResult,
    limit,
    offset,
    hasMore: offset + entries.length < countResult,
  }
}

/**
 * Helper to extract IP and user-agent from a Request object.
 */
export function extractRequestContext(request: Request): {
  ipAddress: string | null
  userAgent: string | null
} {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  const userAgent = request.headers.get('user-agent') || null
  return { ipAddress, userAgent }
}
