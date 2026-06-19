import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { buildAlertPayload, deliverAlert } from '@/lib/notifications/alerts'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { db } from '@/db'
import { workspaceNotification } from '@/db/schema'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; notificationId: string }> }
) {
  const { id: workspaceId, notificationId } = await params

  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const permission = await getUserEntityPermissions(session.user.id, 'workspace', workspaceId)
  if (permission !== 'write' && permission !== 'admin') {
    return NextResponse.json({ error: 'Write access required' }, { status: 403 })
  }

  const [n] = await db
    .select()
    .from(workspaceNotification)
    .where(
      and(
        eq(workspaceNotification.id, notificationId),
        eq(workspaceNotification.workspaceId, workspaceId)
      )
    )
    .limit(1)

  if (!n) return NextResponse.json({ error: 'Notification not found' }, { status: 404 })

  const now = new Date().toISOString()
  const sampleRun = {
    workspaceId,
    workflowId: 'wf_test',
    workflowName: 'Test workflow',
    executionId: `test_${Date.now()}`,
    status: 'error' as const,
    level: 'error' as const,
    trigger: 'manual',
    totalDurationMs: 1234,
    cost: 0.0042,
    startedAt: now,
    endedAt: now,
  }
  const payload = buildAlertPayload({ id: n.id }, sampleRun)
  const summary = `Test alert "${n.name}" — this confirms your ${n.channelType} channel is working.`
  const result = await deliverAlert(n.channelType, n.channelConfig, payload, summary)

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
