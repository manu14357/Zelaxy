import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { listWorkspaceFiles } from '@/lib/files/workspace-files'
import { getUserEntityPermissions } from '@/lib/permissions/utils'

export const dynamic = 'force-dynamic'

// GET /api/workspaces/[id]/files — list the workspace Files store
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const permission = await getUserEntityPermissions(session.user.id, 'workspace', workspaceId)
  if (permission === null) {
    return NextResponse.json({ error: 'Not authorized for this workspace' }, { status: 403 })
  }

  const files = await listWorkspaceFiles(workspaceId)
  return NextResponse.json({ files })
}
