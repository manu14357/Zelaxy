import { and, eq, ne } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { extractRequestContext, recordAuditLog } from '@/lib/audit/service'
import { getSession } from '@/lib/auth'
import {
  getOrganizationSeatAnalytics,
  getOrganizationSeatInfo,
  updateOrganizationSeats,
} from '@/lib/billing/validation/seat-management'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { invitation, member, organization, permissions, workspace } from '@/db/schema'

const logger = createLogger('OrganizationAPI')

/**
 * GET /api/organizations/[id]
 * Get organization details including settings and seat information
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId } = await params
    const url = new URL(request.url)
    const includeSeats = url.searchParams.get('include') === 'seats'

    // Verify user has access to this organization
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

    // Get organization data
    const organizationEntry = await db
      .select()
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1)

    if (organizationEntry.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const userRole = memberEntry[0].role
    const hasAdminAccess = ['owner', 'admin'].includes(userRole)

    const response: any = {
      success: true,
      data: {
        id: organizationEntry[0].id,
        name: organizationEntry[0].name,
        slug: organizationEntry[0].slug,
        logo: organizationEntry[0].logo,
        metadata: organizationEntry[0].metadata,
        createdAt: organizationEntry[0].createdAt,
        updatedAt: organizationEntry[0].updatedAt,
      },
      userRole,
      hasAdminAccess,
    }

    // Include seat information if requested
    if (includeSeats) {
      const seatInfo = await getOrganizationSeatInfo(organizationId)
      if (seatInfo) {
        response.data.seats = seatInfo
      }

      // Include analytics for admins
      if (hasAdminAccess) {
        const analytics = await getOrganizationSeatAnalytics(organizationId)
        if (analytics) {
          response.data.seatAnalytics = analytics
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error('Failed to get organization', {
      organizationId: (await params).id,
      error,
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/organizations/[id]
 * Update organization settings or seat count
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId } = await params
    const body = await request.json()
    const { name, slug, logo, seats } = body

    // Verify user has admin access
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
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Handle seat count update
    if (seats !== undefined) {
      if (typeof seats !== 'number' || seats < 1) {
        return NextResponse.json({ error: 'Invalid seat count' }, { status: 400 })
      }

      const result = await updateOrganizationSeats(organizationId, seats, session.user.id)

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      logger.info('Organization seat count updated', {
        organizationId,
        newSeatCount: seats,
        updatedBy: session.user.id,
      })

      return NextResponse.json({
        success: true,
        message: 'Seat count updated successfully',
        data: {
          seats: seats,
          updatedBy: session.user.id,
          updatedAt: new Date().toISOString(),
        },
      })
    }

    // Handle settings update
    if (name !== undefined || slug !== undefined || logo !== undefined) {
      // Validate required fields
      if (name !== undefined && (!name || typeof name !== 'string' || name.trim().length === 0)) {
        return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
      }

      if (slug !== undefined && (!slug || typeof slug !== 'string' || slug.trim().length === 0)) {
        return NextResponse.json({ error: 'Organization slug is required' }, { status: 400 })
      }

      // Validate slug format
      if (slug !== undefined) {
        const slugRegex = /^[a-z0-9-_]+$/
        if (!slugRegex.test(slug)) {
          return NextResponse.json(
            {
              error: 'Slug can only contain lowercase letters, numbers, hyphens, and underscores',
            },
            { status: 400 }
          )
        }

        // Check if slug is already taken by another organization
        const existingSlug = await db
          .select()
          .from(organization)
          .where(and(eq(organization.slug, slug), ne(organization.id, organizationId)))
          .limit(1)

        if (existingSlug.length > 0) {
          return NextResponse.json({ error: 'This slug is already taken' }, { status: 400 })
        }
      }

      // Build update object with only provided fields
      const updateData: any = { updatedAt: new Date() }
      if (name !== undefined) updateData.name = name.trim()
      if (slug !== undefined) updateData.slug = slug.trim()
      if (logo !== undefined) updateData.logo = logo || null

      // Update organization
      const updatedOrg = await db
        .update(organization)
        .set(updateData)
        .where(eq(organization.id, organizationId))
        .returning()

      if (updatedOrg.length === 0) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }

      logger.info('Organization settings updated', {
        organizationId,
        updatedBy: session.user.id,
        changes: { name, slug, logo },
      })

      // Audit log
      const { ipAddress, userAgent } = extractRequestContext(request)
      recordAuditLog({
        userId: session.user.id,
        organizationId,
        action: 'org.updated',
        entityType: 'organization',
        entityId: organizationId,
        metadata: { changes: { name, slug, logo } },
        ipAddress,
        userAgent,
      })

      return NextResponse.json({
        success: true,
        message: 'Organization updated successfully',
        data: {
          id: updatedOrg[0].id,
          name: updatedOrg[0].name,
          slug: updatedOrg[0].slug,
          logo: updatedOrg[0].logo,
          updatedAt: updatedOrg[0].updatedAt,
        },
      })
    }

    return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 })
  } catch (error) {
    logger.error('Failed to update organization', {
      organizationId: (await params).id,
      error,
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/organizations/[id]
// Delete an organization and clean up all associated resources
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId } = await params

    // Only owners can delete organizations
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

    if (memberEntry[0].role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden - Only the organization owner can delete it' },
        { status: 403 }
      )
    }

    // Get org details before deletion for audit purposes
    const orgDetails = await db
      .select()
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1)

    if (orgDetails.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Clean up in order:
    // 1. Remove workspace org links (don't delete workspaces, just unlink them)
    await db
      .update(workspace)
      .set({ organizationId: null, updatedAt: new Date() })
      .where(eq(workspace.organizationId, organizationId))

    // 2. Remove org-level permissions
    await db
      .delete(permissions)
      .where(
        and(eq(permissions.entityType, 'organization'), eq(permissions.entityId, organizationId))
      )

    // 3. Remove all invitations
    await db.delete(invitation).where(eq(invitation.organizationId, organizationId))

    // 4. Remove all members
    await db.delete(member).where(eq(member.organizationId, organizationId))

    // 5. Delete the organization itself
    await db.delete(organization).where(eq(organization.id, organizationId))

    logger.info('Organization deleted', {
      organizationId,
      organizationName: orgDetails[0].name,
      deletedBy: session.user.id,
    })

    // Audit log
    const { ipAddress, userAgent } = extractRequestContext(request)
    recordAuditLog({
      userId: session.user.id,
      organizationId,
      action: 'org.deleted',
      entityType: 'organization',
      entityId: organizationId,
      metadata: {
        organizationName: orgDetails[0].name,
        organizationSlug: orgDetails[0].slug,
      },
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      message: 'Organization deleted successfully',
    })
  } catch (error) {
    logger.error('Failed to delete organization', {
      organizationId: (await params).id,
      error,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
