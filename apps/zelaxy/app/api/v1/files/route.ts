import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createLogger } from '@/lib/logs/console/logger'
import { uploadFile } from '@/lib/uploads/storage-client'
import {
  checkRateLimit,
  createRateLimitResponse,
  validateWorkspaceAccess,
} from '@/app/api/v1/middleware'

const logger = createLogger('V1FilesAPI')

export const dynamic = 'force-dynamic'
export const revalidate = 0

const UploadSchema = z.object({
  workspaceId: z.string().min(1, 'workspaceId is required'),
})

/**
 * GET /api/v1/files — List files.
 *
 * Note: Zelaxy does not maintain a dedicated workspace files table.
 * Uploaded files are referenced by their storage key. This endpoint
 * returns an empty list. Use POST to upload and GET /api/v1/files/[fileId]
 * to retrieve download URLs for known file keys.
 */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const rateLimit = await checkRateLimit(request, 'files')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit)
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    const userId = rateLimit.userId!
    const accessError = await validateWorkspaceAccess(rateLimit, userId, workspaceId)
    if (accessError) return accessError

    logger.info(`[${requestId}] Files list requested for workspace ${workspaceId}`)

    return NextResponse.json({
      success: true,
      data: {
        files: [],
        totalCount: 0,
        note: 'File listing is not available. Use POST to upload files and GET /api/v1/files/[fileKey] to retrieve download URLs.',
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error listing files`, { error })
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 })
  }
}

/**
 * POST /api/v1/files — Upload a file.
 *
 * Expects multipart/form-data with:
 *  - file: the file to upload
 *  - workspaceId: workspace ID
 *
 * Returns a fileId (storage key) that can be used with GET /api/v1/files/[fileId].
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const rateLimit = await checkRateLimit(request, 'files')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit)
    }

    const userId = rateLimit.userId!

    const formData = await request.formData()
    const workspaceId = formData.get('workspaceId')

    const parsed = UploadSchema.safeParse({ workspaceId })
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const accessError = await validateWorkspaceAccess(rateLimit, userId, parsed.data.workspaceId, 'write')
    if (accessError) return accessError

    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided. Include a "file" field in the form data.' }, { status: 400 })
    }

    const maxSizeBytes = 100 * 1024 * 1024 // 100 MB
    if (file.size > maxSizeBytes) {
      return NextResponse.json({ error: 'File exceeds 100 MB limit' }, { status: 413 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const contentType = file.type || 'application/octet-stream'

    const fileInfo = await uploadFile(buffer, file.name, contentType, file.size)

    logger.info(`[${requestId}] Uploaded file ${fileInfo.key} for workspace ${parsed.data.workspaceId}`)

    return NextResponse.json(
      {
        success: true,
        data: {
          fileId: fileInfo.key,
          name: fileInfo.name,
          size: fileInfo.size,
          type: fileInfo.type,
          path: fileInfo.path,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error(`[${requestId}] Error uploading file`, { error })
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
