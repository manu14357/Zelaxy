import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/admin/utils'
import { db } from '@/db'
import * as schema from '@/db/schema'

// GET /api/admin/settings — Retrieve platform settings
export async function GET() {
  const { isAdmin } = await isCurrentUserAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized — admin access required' }, { status: 403 })
  }

  try {
    const rows = await db
      .select()
      .from(schema.platformSettings)
      .where(eq(schema.platformSettings.id, 'default'))
    const settings = rows[0] || {
      id: 'default',
      allowedSignupDomains: null,
      disableRegistration: false,
      requireEmailVerification: true,
      defaultUserRole: 'member',
      maxWorkspacesPerUser: 10,
    }

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error('Error fetching platform settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT /api/admin/settings — Update platform settings
export async function PUT(request: Request) {
  const { isAdmin, session } = await isCurrentUserAdmin()
  if (!isAdmin || !session?.user) {
    return NextResponse.json({ error: 'Unauthorized — admin access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      allowedSignupDomains,
      disableRegistration,
      requireEmailVerification,
      defaultUserRole,
      maxWorkspacesPerUser,
    } = body

    // Validate allowed domains format
    if (
      allowedSignupDomains !== undefined &&
      allowedSignupDomains !== null &&
      allowedSignupDomains !== ''
    ) {
      const domains = allowedSignupDomains.split(',').map((d: string) => d.trim())
      for (const domain of domains) {
        if (domain && !/^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/.test(domain)) {
          return NextResponse.json(
            { error: `Invalid domain format: "${domain}". Use format like "company.com"` },
            { status: 400 }
          )
        }
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
      updatedBy: session.user.id,
    }

    if (allowedSignupDomains !== undefined) {
      updateData.allowedSignupDomains = allowedSignupDomains || null
    }
    if (disableRegistration !== undefined) {
      updateData.disableRegistration = Boolean(disableRegistration)
    }
    if (requireEmailVerification !== undefined) {
      updateData.requireEmailVerification = Boolean(requireEmailVerification)
    }
    if (defaultUserRole !== undefined) {
      if (!['member', 'admin'].includes(defaultUserRole)) {
        return NextResponse.json(
          { error: 'Invalid role. Must be "member" or "admin"' },
          { status: 400 }
        )
      }
      updateData.defaultUserRole = defaultUserRole
    }
    if (maxWorkspacesPerUser !== undefined) {
      const max = Number(maxWorkspacesPerUser)
      if (Number.isNaN(max) || max < 1 || max > 1000) {
        return NextResponse.json(
          { error: 'Max workspaces must be between 1 and 1000' },
          { status: 400 }
        )
      }
      updateData.maxWorkspacesPerUser = max
    }

    // Upsert: insert if not exists, update if exists
    await db
      .insert(schema.platformSettings)
      .values({
        id: 'default',
        allowedSignupDomains: (updateData.allowedSignupDomains as string) || null,
        disableRegistration: (updateData.disableRegistration as boolean) ?? false,
        requireEmailVerification: (updateData.requireEmailVerification as boolean) ?? true,
        defaultUserRole: (updateData.defaultUserRole as string) ?? 'member',
        maxWorkspacesPerUser: (updateData.maxWorkspacesPerUser as number) ?? 10,
        updatedAt: new Date(),
        updatedBy: session.user.id,
      })
      .onConflictDoUpdate({
        target: schema.platformSettings.id,
        set: updateData,
      })

    // Fetch updated settings
    const rows = await db
      .select()
      .from(schema.platformSettings)
      .where(eq(schema.platformSettings.id, 'default'))

    return NextResponse.json({ success: true, data: rows[0] })
  } catch (error) {
    console.error('Error updating platform settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
