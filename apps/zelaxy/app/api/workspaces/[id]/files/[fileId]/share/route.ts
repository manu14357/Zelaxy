import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import {
  createPublicShare,
  getShareForFile,
  type PublicShareMode,
  revokePublicShare,
} from '@/lib/public-shares/share-manager'
import { getBaseUrl } from '@/lib/urls/utils'
import { db } from '@/db'
import { workspaceFile } from '@/db/schema'

const logger = createLogger('WorkspaceFileShareAPI')

export const dynamic = 'force-dynamic'

const CreateSchema = z
  .object({
    mode: z.enum(['public', 'password', 'email', 'sso']),
    password: z.string().min(1).max(256).optional(),
    allowedEmails: z.array(z.string().min(1)).max(200).optional(),
    // ISO timestamp; null/omitted = never expires
    expiresAt: z.string().datetime().nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.mode === 'password' && !val.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'password is required when mode is "password"',
        path: ['password'],
      })
    }
    if (val.mode === 'email' && (!val.allowedEmails || val.allowedEmails.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'allowedEmails is required when mode is "email"',
        path: ['allowedEmails'],
      })
    }
  })

async function requireWrite(workspaceId: string) {
  const session = await getSession()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const permission = await getUserEntityPermissions(session.user.id, 'workspace', workspaceId)
  if (permission !== 'write' && permission !== 'admin') {
    return { error: NextResponse.json({ error: 'Write access required' }, { status: 403 }) }
  }
  return { userId: session.user.id }
}

function shareUrl(token: string): string {
  return `${getBaseUrl()}/api/files/public/${token}`
}

function serializeShare(share: {
  token: string
  mode: string
  allowedEmails: string[] | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  // Never leak passwordHash.
  return {
    token: share.token,
    url: shareUrl(share.token),
    mode: share.mode,
    allowedEmails: share.allowedEmails ?? [],
    expiresAt: share.expiresAt ? share.expiresAt.toISOString() : null,
    createdAt: share.createdAt.toISOString(),
    updatedAt: share.updatedAt.toISOString(),
  }
}

// GET — current share for the file (read access), or { share: null }
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { id: workspaceId, fileId } = await params
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const permission = await getUserEntityPermissions(session.user.id, 'workspace', workspaceId)
  if (permission === null) {
    return NextResponse.json({ error: 'Not authorized for this workspace' }, { status: 403 })
  }

  const share = await getShareForFile(workspaceId, fileId)
  return NextResponse.json({ share: share ? serializeShare(share) : null })
}

// POST — create or update the file's public share (write access)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { id: workspaceId, fileId } = await params
  const auth = await requireWrite(workspaceId)
  if (auth.error) return auth.error

  let body: z.infer<typeof CreateSchema>
  try {
    body = CreateSchema.parse(await req.json())
  } catch (error) {
    const message =
      error instanceof z.ZodError ? error.errors.map((e) => e.message).join(', ') : 'Invalid body'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // The file must exist in THIS workspace before it can be shared.
  const [file] = await db
    .select({ id: workspaceFile.id })
    .from(workspaceFile)
    .where(and(eq(workspaceFile.id, fileId), eq(workspaceFile.workspaceId, workspaceId)))
    .limit(1)
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  try {
    const share = await createPublicShare({
      workspaceId,
      fileId,
      mode: body.mode as PublicShareMode,
      createdBy: auth.userId,
      password: body.password ?? null,
      allowedEmails: body.allowedEmails ?? null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    })
    return NextResponse.json({ share: serializeShare(share) }, { status: 200 })
  } catch (error) {
    logger.error('Failed to create public share', { error })
    const message = error instanceof Error ? error.message : 'Failed to create share'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

// DELETE — revoke the file's public share (write access)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { id: workspaceId, fileId } = await params
  const auth = await requireWrite(workspaceId)
  if (auth.error) return auth.error

  const revoked = await revokePublicShare(workspaceId, fileId)
  if (!revoked) return NextResponse.json({ error: 'No share to revoke' }, { status: 404 })
  return NextResponse.json({ success: true, revoked: true })
}
