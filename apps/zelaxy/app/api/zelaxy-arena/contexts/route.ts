import { and, eq, isNull } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { db } from '@/db'
import { knowledgeBase, workflow, workspaceFile } from '@/db/schema'

export const dynamic = 'force-dynamic'

/**
 * GET /api/zelaxy-arena/contexts?workspaceId= — the mention-data provider for ZelaxyArena's @-menu.
 * Returns the workspace resources the user can reference (workflows, knowledge bases, files) in a
 * single shape: { contexts: [{ type, id, label }] }.
 */
export async function GET(req: NextRequest) {
  const workspaceId = new URL(req.url).searchParams.get('workspaceId')
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })

  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const permission = await getUserEntityPermissions(session.user.id, 'workspace', workspaceId)
  if (permission === null) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [workflows, kbs, files] = await Promise.all([
    db
      .select({ id: workflow.id, label: workflow.name })
      .from(workflow)
      .where(eq(workflow.workspaceId, workspaceId))
      .limit(100),
    db
      .select({ id: knowledgeBase.id, label: knowledgeBase.name })
      .from(knowledgeBase)
      .where(and(eq(knowledgeBase.workspaceId, workspaceId), isNull(knowledgeBase.deletedAt)))
      .limit(100),
    db
      .select({ id: workspaceFile.id, label: workspaceFile.name })
      .from(workspaceFile)
      .where(eq(workspaceFile.workspaceId, workspaceId))
      .limit(100),
  ])

  const contexts = [
    ...workflows.map((w) => ({ type: 'workflow' as const, id: w.id, label: w.label })),
    ...kbs.map((k) => ({ type: 'knowledge' as const, id: k.id, label: k.label })),
    ...files.map((f) => ({ type: 'file' as const, id: f.id, label: f.label })),
  ]

  return NextResponse.json({ contexts })
}
