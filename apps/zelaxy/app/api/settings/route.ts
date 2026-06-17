import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'

export const dynamic = 'force-dynamic'

const logger = createLogger('SettingsAPI')

const UpdateSettingsSchema = z.object({
  allowedLoginDomains: z.string().optional().nullable(),
  disableRegistration: z.boolean().optional(),
})

function parseCommaList(value: string | undefined | null): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

// GET /api/settings — Returns public platform feature settings for authenticated users
export async function GET() {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.debug(`[${requestId}] Settings requested by ${session.user.id}`)

    const settings = {
      // Feature availability
      speechEnabled: !!env.ELEVENLABS_API_KEY,
      billingEnabled: env.BILLING_ENABLED ?? false,
      registrationDisabled: env.DISABLE_REGISTRATION ?? false,

      // Allowed login configuration (omit actual values for non-admin)
      allowedLoginDomainsConfigured: !!(env.ALLOWED_LOGIN_DOMAINS || env.ALLOWED_LOGIN_EMAILS),

      // Integrations
      githubIntegrationEnabled: !!env.GITHUB_TOKEN,
    }

    return NextResponse.json({ settings })
  } catch (error) {
    logger.error(`[${requestId}] Error fetching settings:`, error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PATCH /api/settings — Update workspace/platform settings (admin only)
export async function PATCH(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = UpdateSettingsSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 }
      )
    }

    // Settings mutations require admin access — redirect to admin/settings
    logger.warn(
      `[${requestId}] Settings mutation attempted by ${session.user.id} — use /api/admin/settings`
    )

    return NextResponse.json(
      { error: 'Use /api/admin/settings to update platform settings' },
      { status: 403 }
    )
  } catch (error) {
    logger.error(`[${requestId}] Error updating settings:`, error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
