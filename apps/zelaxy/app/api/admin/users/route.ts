import { desc, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/admin/utils'
import { db } from '@/db'
import * as schema from '@/db/schema'

// GET /api/admin/users — List all users with stats
export async function GET(request: Request) {
  const { isAdmin } = await isCurrentUserAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized — admin access required' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '50')))
    const search = searchParams.get('search')?.trim() || ''
    const offset = (page - 1) * limit

    // Build where clause
    let whereClause = sql`1=1`
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`
      whereClause = sql`(LOWER(${schema.user.name}) LIKE ${searchLower} OR LOWER(${schema.user.email}) LIKE ${searchLower})`
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.user)
      .where(whereClause)
    const totalCount = countResult[0]?.count ?? 0

    // Get users with workspace count
    const users = await db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        emailVerified: schema.user.emailVerified,
        image: schema.user.image,
        company: schema.user.company,
        createdAt: schema.user.createdAt,
        updatedAt: schema.user.updatedAt,
      })
      .from(schema.user)
      .where(whereClause)
      .orderBy(desc(schema.user.createdAt))
      .limit(limit)
      .offset(offset)

    // Get workspace counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const [workspaceCount, orgMemberships] = await Promise.all([
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(schema.workspace)
            .where(sql`${schema.workspace.ownerId} = ${u.id}`),
          db
            .select({
              orgId: schema.member.organizationId,
              orgName: schema.organization.name,
              role: schema.member.role,
            })
            .from(schema.member)
            .leftJoin(
              schema.organization,
              sql`${schema.member.organizationId} = ${schema.organization.id}`
            )
            .where(sql`${schema.member.userId} = ${u.id}`),
        ])

        return {
          ...u,
          workspaceCount: workspaceCount[0]?.count ?? 0,
          organizations: orgMemberships.map((m) => ({
            id: m.orgId,
            name: m.orgName,
            role: m.role,
          })),
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
