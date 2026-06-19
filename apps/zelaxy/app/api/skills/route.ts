import { randomUUID } from 'crypto'
import { and, desc, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { normalizeSkillName } from '@/lib/skills/parse'
import { db } from '@/db'
import { agentSkill } from '@/db/schema'

const logger = createLogger('SkillsAPI')

export const dynamic = 'force-dynamic'

const CreateSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).max(64),
  description: z.string().min(1).max(1024),
  content: z.string().min(1),
})

async function checkPermission(workspaceId: string, need: 'read' | 'write') {
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

// GET /api/skills?workspaceId=... — list skills for a workspace
export async function GET(req: NextRequest) {
  const workspaceId = new URL(req.url).searchParams.get('workspaceId')
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })

  const auth = await checkPermission(workspaceId, 'read')
  if (auth.error) return auth.error

  const rows = await db
    .select()
    .from(agentSkill)
    .where(eq(agentSkill.workspaceId, workspaceId))
    .orderBy(desc(agentSkill.updatedAt))

  return NextResponse.json({ skills: rows })
}

// POST /api/skills — create a skill
export async function POST(req: NextRequest) {
  let body: z.infer<typeof CreateSchema>
  try {
    body = CreateSchema.parse(await req.json())
  } catch (error) {
    const message =
      error instanceof z.ZodError ? error.errors.map((e) => e.message).join(', ') : 'Invalid body'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const auth = await checkPermission(body.workspaceId, 'write')
  if (auth.error) return auth.error

  let name: string
  try {
    name = normalizeSkillName(body.name)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Invalid name' },
      { status: 400 }
    )
  }

  // Names are unique per workspace.
  const existing = await db
    .select({ id: agentSkill.id })
    .from(agentSkill)
    .where(and(eq(agentSkill.workspaceId, body.workspaceId), eq(agentSkill.name, name)))
    .limit(1)
  if (existing.length > 0) {
    return NextResponse.json({ error: `A skill named "${name}" already exists` }, { status: 409 })
  }

  const id = randomUUID()
  const now = new Date()
  await db.insert(agentSkill).values({
    id,
    workspaceId: body.workspaceId,
    name,
    description: body.description,
    content: body.content,
    createdBy: auth.userId ?? null,
    createdAt: now,
    updatedAt: now,
  })

  logger.info(`Created skill "${name}" in workspace ${body.workspaceId}`)
  return NextResponse.json({ id, name }, { status: 201 })
}
