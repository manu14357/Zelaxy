import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { user } from '@/db/schema'

const logger = createLogger('UpdateProfile')

export async function POST(request: NextRequest) {
  try {
    // Get the session from better-auth
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, bio, company, location } = body

    logger.info('Received profile update request', {
      userId: session.user.id,
      body: { name, email, bio, company, location },
    })

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Update user profile
    const updatedUser = await db
      .update(user)
      .set({
        name,
        email,
        bio: bio || null,
        company: company || null,
        location: location || null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id))
      .returning()

    if (!updatedUser.length) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    logger.info('Profile updated successfully', {
      userId: session.user.id,
      fields: { name, email, bio, company, location },
      updatedUser: updatedUser[0],
    })

    return NextResponse.json({
      success: true,
      user: updatedUser[0],
    })
  } catch (error) {
    logger.error('Error updating profile:', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
