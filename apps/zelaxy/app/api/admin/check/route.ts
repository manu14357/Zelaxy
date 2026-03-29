import { NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/admin/utils'

// GET /api/admin/check — Check if current user is a platform admin
export async function GET() {
  const { isAdmin, session } = await isCurrentUserAdmin()

  return NextResponse.json({
    success: true,
    data: {
      isAdmin,
      email: session?.user?.email || null,
    },
  })
}
