import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { user } from '@/db/schema'

const logger = createLogger('GetProfile')

export async function GET(request: NextRequest) {
  try {
    // Get the session from better-auth
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch complete user profile from database
    const userProfile = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1)

    if (!userProfile.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const profile = userProfile[0]

    logger.info('Profile fetched successfully', {
      userId: session.user.id,
      profile: {
        name: profile.name,
        email: profile.email,
        bio: profile.bio,
        company: profile.company,
        location: profile.location,
      },
    })

    return NextResponse.json({
      success: true,
      user: profile,
    })
  } catch (error) {
    logger.error('Error fetching profile:', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
