import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { normalizeSkillName } from '@/lib/skills/parse'
import { db } from '@/db'
import { agentSkill } from '@/db/schema'

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).max(64).optional(),
  description: z.string().min(1).max(1024).optional(),
  content: z.string().min(1).optional(),
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let body: z.infer<typeof UpdateSchema>
  try {
    body = UpdateSchema.parse(await req.json())
  } catch (error) {
    const message =
      error instanceof z.ZodError ? error.errors.map((e) => e.message).join(', ') : 'Invalid body'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const auth = await requireWrite(body.workspaceId)
  if (auth.error) return auth.error

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (body.name !== undefined) updateData.name = normalizeSkillName(body.name)
  if (body.description !== undefined) updateData.description = body.description
  if (body.content !== undefined) updateData.content = body.content

  const result = await db
    .update(agentSkill)
    .set(updateData)
    .where(and(eq(agentSkill.id, id), eq(agentSkill.workspaceId, body.workspaceId)))
    .returning({ id: agentSkill.id })

  if (result.length === 0) return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
  return NextResponse.json({ id })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const workspaceId = new URL(req.url).searchParams.get('workspaceId')
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })

  const auth = await requireWrite(workspaceId)
  if (auth.error) return auth.error

  await db
    .delete(agentSkill)
    .where(and(eq(agentSkill.id, id), eq(agentSkill.workspaceId, workspaceId)))
  return NextResponse.json({ deleted: true })
}
