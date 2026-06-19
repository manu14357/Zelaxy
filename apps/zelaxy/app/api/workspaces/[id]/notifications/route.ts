import { and, desc, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { db } from '@/db'
import { workspaceNotification } from '@/db/schema'

const logger = createLogger('WorkspaceNotificationsAPI')

export const dynamic = 'force-dynamic'

const MAX_PER_CHANNEL = 10

const RULE_TYPES = [
  'consecutive_failures',
  'failure_rate',
  'error_count',
  'latency_threshold',
  'latency_spike',
  'cost_threshold',
  'no_activity',
] as const

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  enabled: z.boolean().optional().default(true),
  ruleType: z.enum(RULE_TYPES),
  ruleConfig: z.record(z.any()).optional().default({}),
  channelType: z.enum(['webhook', 'email', 'slack']),
  channelConfig: z.record(z.any()).optional().default({}),
  levelFilter: z.enum(['info', 'error']).nullable().optional(),
  triggerFilter: z.array(z.string()).nullable().optional(),
  workflowIds: z.array(z.string()).nullable().optional(),
})

async function requirePermission(workspaceId: string, need: 'read' | 'write') {
  const session = await getSession()
  if (!session?.user?.id)
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const permission = await getUserEntityPermissions(session.user.id, 'workspace', workspaceId)
  if (permission === null) {
    return {
      error: NextResponse.json({ error: 'Not authorized for this workspace' }, { status: 403 }),
    }
  }
  if (need === 'write' && permission === 'read') {
    return { error: NextResponse.json({ error: 'Write access required' }, { status: 403 }) }
  }
  return { userId: session.user.id }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params
  const auth = await requirePermission(workspaceId, 'read')
  if (auth.error) return auth.error

  const rows = await db
    .select()
    .from(workspaceNotification)
    .where(eq(workspaceNotification.workspaceId, workspaceId))
    .orderBy(desc(workspaceNotification.createdAt))

  return NextResponse.json({ notifications: rows })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params
  const auth = await requirePermission(workspaceId, 'write')
  if (auth.error) return auth.error

  let body: z.infer<typeof CreateSchema>
  try {
    body = CreateSchema.parse(await req.json())
  } catch (error) {
    const message =
      error instanceof z.ZodError ? error.errors.map((e) => e.message).join(', ') : 'Invalid body'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // Enforce up to 10 alerts of each channel type.
  const existing = await db
    .select({ channelType: workspaceNotification.channelType })
    .from(workspaceNotification)
    .where(
      and(
        eq(workspaceNotification.workspaceId, workspaceId),
        eq(workspaceNotification.channelType, body.channelType)
      )
    )
  if (existing.length >= MAX_PER_CHANNEL) {
    return NextResponse.json(
      {
        error: `Limit reached: at most ${MAX_PER_CHANNEL} ${body.channelType} alerts per workspace`,
      },
      { status: 400 }
    )
  }

  const id = crypto.randomUUID()
  const now = new Date()
  await db.insert(workspaceNotification).values({
    id,
    workspaceId,
    name: body.name,
    enabled: body.enabled,
    ruleType: body.ruleType,
    ruleConfig: body.ruleConfig,
    channelType: body.channelType,
    channelConfig: body.channelConfig,
    levelFilter: body.levelFilter ?? null,
    triggerFilter: body.triggerFilter ?? null,
    workflowIds: body.workflowIds ?? null,
    createdBy: auth.userId ?? null,
    createdAt: now,
    updatedAt: now,
  })

  logger.info('Created workspace notification', { workspaceId, id, ruleType: body.ruleType })
  return NextResponse.json({ id }, { status: 201 })
}
