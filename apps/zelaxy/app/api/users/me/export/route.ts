import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { settings, user, workflow } from '@/db/schema'

const logger = createLogger('UserDataExportAPI')

/**
 * GET /api/users/me/export — returns a JSON download of the signed-in user's personal data
 * (profile, settings, and their workflows). Read-only; powers the Privacy → "Export Your Data" button.
 */
export async function GET() {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const [profile] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        company: user.company,
        location: user.location,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    const [userSettings] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, userId))
      .limit(1)

    const workflows = await db
      .select({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        workspaceId: workflow.workspaceId,
        state: workflow.state,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
      })
      .from(workflow)
      .where(eq(workflow.userId, userId))

    const payload = {
      exportedAt: new Date().toISOString(),
      profile: profile ?? null,
      settings: userSettings
        ? {
            theme: userSettings.theme,
            autoConnect: userSettings.autoConnect,
            autoPan: userSettings.autoPan,
            consoleExpandedByDefault: userSettings.consoleExpandedByDefault,
            telemetryEnabled: userSettings.telemetryEnabled,
            emailPreferences: userSettings.emailPreferences ?? {},
          }
        : null,
      workflows,
    }

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="zelaxy-data-export.json"`,
      },
    })
  } catch (error: any) {
    logger.error(`[${requestId}] Data export failed`, error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
