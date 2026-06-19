import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { deleteFile } from '@/lib/uploads'
import { db } from '@/db'
import { workspaceFile } from '@/db/schema'

const logger = createLogger('WorkspaceFileAPI')

export const dynamic = 'force-dynamic'

const PatchSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  folder: z.string().nullable().optional(),
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

// PATCH /api/workspaces/[id]/files/[fileId] — rename or move a file
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { id: workspaceId, fileId } = await params
  const auth = await requireWrite(workspaceId)
  if (auth.error) return auth.error

  let body: z.infer<typeof PatchSchema>
  try {
    body = PatchSchema.parse(await req.json())
  } catch (error) {
    const message =
      error instanceof z.ZodError ? error.errors.map((e) => e.message).join(', ') : 'Invalid body'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (body.name !== undefined) updateData.name = body.name
  if (body.folder !== undefined) updateData.folder = body.folder

  const result = await db
    .update(workspaceFile)
    .set(updateData)
    .where(and(eq(workspaceFile.id, fileId), eq(workspaceFile.workspaceId, workspaceId)))
    .returning({ id: workspaceFile.id })

  if (result.length === 0) return NextResponse.json({ error: 'File not found' }, { status: 404 })
  return NextResponse.json({ success: true, id: fileId })
}

// DELETE /api/workspaces/[id]/files/[fileId] — remove from store + storage
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { id: workspaceId, fileId } = await params
  const auth = await requireWrite(workspaceId)
  if (auth.error) return auth.error

  const [file] = await db
    .select({ key: workspaceFile.key })
    .from(workspaceFile)
    .where(and(eq(workspaceFile.id, fileId), eq(workspaceFile.workspaceId, workspaceId)))
    .limit(1)
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  // Best-effort storage delete; the catalog row is the source of truth for the UI.
  try {
    await deleteFile(file.key)
  } catch (e) {
    logger.warn(`Failed to delete storage object for file ${fileId}`, { e })
  }

  await db
    .delete(workspaceFile)
    .where(and(eq(workspaceFile.id, fileId), eq(workspaceFile.workspaceId, workspaceId)))
  return NextResponse.json({ success: true, deleted: true })
}
