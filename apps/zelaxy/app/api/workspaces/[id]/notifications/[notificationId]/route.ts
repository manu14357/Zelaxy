import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { db } from '@/db'
import { workspaceNotification } from '@/db/schema'

const logger = createLogger('WorkspaceNotificationAPI')

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  enabled: z.boolean().optional(),
  ruleType: z.string().optional(),
  ruleConfig: z.record(z.any()).optional(),
  channelType: z.enum(['webhook', 'email', 'slack']).optional(),
  channelConfig: z.record(z.any()).optional(),
  levelFilter: z.enum(['info', 'error']).nullable().optional(),
  triggerFilter: z.array(z.string()).nullable().optional(),
  workflowIds: z.array(z.string()).nullable().optional(),
})

async function requireWrite(workspaceId: string) {
  const session = await getSession()
  if (!session?.user?.id)
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const permission = await getUserEntityPermissions(session.user.id, 'workspace', workspaceId)
  if (permission !== 'write' && permission !== 'admin') {
    return { error: NextResponse.json({ error: 'Write access required' }, { status: 403 }) }
  }
  return { userId: session.user.id }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; notificationId: string }> }
) {
  const { id: workspaceId, notificationId } = await params
  const auth = await requireWrite(workspaceId)
  if (auth.error) return auth.error

  let body: z.infer<typeof UpdateSchema>
  try {
    body = UpdateSchema.parse(await req.json())
  } catch (error) {
    const message =
      error instanceof z.ZodError ? error.errors.map((e) => e.message).join(', ') : 'Invalid body'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  for (const [k, v] of Object.entries(body)) {
    if (v !== undefined) updateData[k] = v
  }

  const result = await db
    .update(workspaceNotification)
    .set(updateData)
    .where(
      and(
        eq(workspaceNotification.id, notificationId),
        eq(workspaceNotification.workspaceId, workspaceId)
      )
    )
    .returning({ id: workspaceNotification.id })

  if (result.length === 0) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
  }
  logger.info('Updated workspace notification', { workspaceId, notificationId })
  return NextResponse.json({ id: notificationId })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; notificationId: string }> }
) {
  const { id: workspaceId, notificationId } = await params
  const auth = await requireWrite(workspaceId)
  if (auth.error) return auth.error

  await db
    .delete(workspaceNotification)
    .where(
      and(
        eq(workspaceNotification.id, notificationId),
        eq(workspaceNotification.workspaceId, workspaceId)
      )
    )
  return NextResponse.json({ deleted: true })
}
