import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'
import { deleteFile, getPresignedUrl } from '@/lib/uploads/storage-client'
import {
  checkRateLimit,
  createRateLimitResponse,
  validateWorkspaceAccess,
} from '@/app/api/v1/middleware'

const logger = createLogger('V1FileDetailAPI')

export const revalidate = 0

/**
 * GET /api/v1/files/[fileId] — Get a presigned download URL for a file.
 *
 * The fileId is the storage key returned by POST /api/v1/files.
 * Requires workspaceId query param to verify access.
 * The URL expires in 1 hour by default (pass expiresIn seconds to override).
 */
export async function GET(request: NextRequest, context: { params: Promise<{ fileId: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  // fileId is base64url-encoded to safely pass slashes in the key
  const rawFileId = (await context.params).fileId
  const fileKey = decodeURIComponent(rawFileId)

  try {
    const rateLimit = await checkRateLimit(request, 'file-detail')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit)
    }

    const userId = rateLimit.userId!
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    const accessError = await validateWorkspaceAccess(rateLimit, userId, workspaceId)
    if (accessError) return accessError

    const expiresInRaw = searchParams.get('expiresIn')
    const expiresIn = expiresInRaw ? Math.min(Math.max(Number(expiresInRaw), 60), 86400) : 3600

    const url = await getPresignedUrl(fileKey, expiresIn)

    logger.info(`[${requestId}] Generated presigned URL for key ${fileKey}`)

    return NextResponse.json({
      success: true,
      data: {
        fileId: fileKey,
        url,
        expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error generating presigned URL for key ${fileKey}`, { error })
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/files/[fileId] — Delete a file from storage.
 *
 * Requires workspaceId in the request body or query param to verify access.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const rawFileId = (await context.params).fileId
  const fileKey = decodeURIComponent(rawFileId)

  try {
    const rateLimit = await checkRateLimit(request, 'file-detail')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit)
    }

    const userId = rateLimit.userId!
    const { searchParams } = new URL(request.url)
    let workspaceId = searchParams.get('workspaceId')

    // Also accept workspaceId from body
    if (!workspaceId) {
      try {
        const body = await request.json()
        workspaceId = body?.workspaceId ?? null
      } catch {
        // No body or not JSON — that's fine
      }
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    const accessError = await validateWorkspaceAccess(rateLimit, userId, workspaceId, 'write')
    if (accessError) return accessError

    await deleteFile(fileKey)

    logger.info(`[${requestId}] Deleted file ${fileKey}`)

    return NextResponse.json({ success: true, data: { fileId: fileKey, deleted: true } })
  } catch (error) {
    logger.error(`[${requestId}] Error deleting file ${fileKey}`, { error })
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}
