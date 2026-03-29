import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { extractRequestContext, recordAuditLog } from '@/lib/audit/service'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { organization, subscription } from '@/db/schema'

const logger = createLogger('AdminEnterpriseAPI')

export const dynamic = 'force-dynamic'

// Validation schema for enterprise provisioning
const ProvisionSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  seats: z.number().min(1).max(1000).default(10),
  perSeatAllowance: z.number().min(0).optional(),
  totalAllowance: z.number().min(0).optional(),
  periodMonths: z.number().min(1).max(36).default(12),
})

// Environment variable for admin access (comma-separated email list)
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim().toLowerCase()) || []

/**
 * POST /api/admin/enterprise/provision
 * Provision an enterprise subscription for an organization.
 * Only platform admins (via ADMIN_EMAILS env var) can access this.
 *
 * Body: {
 *   organizationId: string
 *   seats: number
 *   perSeatAllowance?: number  // Per-seat cost allowance
 *   totalAllowance?: number    // Total org cost allowance
 *   periodMonths?: number      // Subscription period in months (default: 12)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a platform admin
    if (!ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      logger.warn('Non-admin attempted enterprise provisioning', {
        userId: session.user.id,
        email: session.user.email,
      })
      return NextResponse.json(
        { error: 'Forbidden - Platform admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()

    let validated: z.infer<typeof ProvisionSchema>
    try {
      validated = ProvisionSchema.parse(body)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validationError.errors },
          { status: 400 }
        )
      }
      throw validationError
    }

    // Must have at least one allowance type
    if (!validated.perSeatAllowance && !validated.totalAllowance) {
      return NextResponse.json(
        { error: 'Either perSeatAllowance or totalAllowance is required for enterprise plans' },
        { status: 400 }
      )
    }

    // Verify organization exists
    const orgEntry = await db
      .select()
      .from(organization)
      .where(eq(organization.id, validated.organizationId))
      .limit(1)

    if (orgEntry.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Check if org already has an active enterprise subscription
    const existingSub = await db
      .select()
      .from(subscription)
      .where(
        and(
          eq(subscription.referenceId, validated.organizationId),
          eq(subscription.plan, 'enterprise'),
          eq(subscription.status, 'active')
        )
      )
      .limit(1)

    if (existingSub.length > 0) {
      return NextResponse.json(
        { error: 'Organization already has an active enterprise subscription' },
        { status: 409 }
      )
    }

    // Calculate period
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + validated.periodMonths)

    const metadata: Record<string, unknown> = {
      provisionedBy: session.user.id,
      provisionedByEmail: session.user.email,
      provisionedAt: now.toISOString(),
    }
    if (validated.perSeatAllowance !== undefined) {
      metadata.perSeatAllowance = validated.perSeatAllowance.toString()
    }
    if (validated.totalAllowance !== undefined) {
      metadata.totalAllowance = validated.totalAllowance.toString()
    }

    // Create the enterprise subscription
    const subscriptionId = crypto.randomUUID()
    await db.insert(subscription).values({
      id: subscriptionId,
      plan: 'enterprise',
      referenceId: validated.organizationId,
      status: 'active',
      seats: validated.seats,
      periodStart: now,
      periodEnd,
      metadata,
    })

    logger.info('Enterprise subscription provisioned', {
      subscriptionId,
      organizationId: validated.organizationId,
      organizationName: orgEntry[0].name,
      seats: validated.seats,
      provisionedBy: session.user.id,
    })

    // Audit log
    const { ipAddress, userAgent } = extractRequestContext(request)
    recordAuditLog({
      userId: session.user.id,
      organizationId: validated.organizationId,
      action: 'subscription.created',
      entityType: 'subscription',
      entityId: subscriptionId,
      metadata: {
        plan: 'enterprise',
        seats: validated.seats,
        periodMonths: validated.periodMonths,
        perSeatAllowance: validated.perSeatAllowance,
        totalAllowance: validated.totalAllowance,
      },
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      message: 'Enterprise subscription provisioned successfully',
      data: {
        subscriptionId,
        organizationId: validated.organizationId,
        organizationName: orgEntry[0].name,
        plan: 'enterprise',
        seats: validated.seats,
        periodStart: now.toISOString(),
        periodEnd: periodEnd.toISOString(),
      },
    })
  } catch (error) {
    logger.error('Failed to provision enterprise subscription', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/admin/enterprise/provision
 * List all enterprise subscriptions. Platform admin only.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const enterpriseSubs = await db
      .select({
        id: subscription.id,
        plan: subscription.plan,
        referenceId: subscription.referenceId,
        status: subscription.status,
        seats: subscription.seats,
        periodStart: subscription.periodStart,
        periodEnd: subscription.periodEnd,
        metadata: subscription.metadata,
        orgName: organization.name,
        orgSlug: organization.slug,
      })
      .from(subscription)
      .leftJoin(organization, eq(subscription.referenceId, organization.id))
      .where(eq(subscription.plan, 'enterprise'))

    return NextResponse.json({
      success: true,
      data: enterpriseSubs,
    })
  } catch (error) {
    logger.error('Failed to list enterprise subscriptions', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
