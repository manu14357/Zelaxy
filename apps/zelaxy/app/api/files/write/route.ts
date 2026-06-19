import { type NextRequest, NextResponse } from 'next/server'
import '@/lib/uploads/setup.server'
import { writeWorkspaceFile } from '@/lib/files/workspace-files'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('FileWriteAPI')

export const dynamic = 'force-dynamic'

/**
 * Internal endpoint for the File block's Write operation. Creates a workspace file from text.
 * Called by the file_write tool with workspaceId/userId from the execution context.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspaceId, userId, fileName, content, contentType } = body || {}

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'No workspace context; cannot write a workspace file' },
        { status: 400 }
      )
    }
    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json({ success: false, error: 'fileName is required' }, { status: 400 })
    }
    if (content === undefined || content === null) {
      return NextResponse.json({ success: false, error: 'content is required' }, { status: 400 })
    }

    const result = await writeWorkspaceFile({
      workspaceId,
      userId: userId ?? null,
      name: fileName,
      content: typeof content === 'string' ? content : JSON.stringify(content),
      contentType,
    })

    return NextResponse.json({ success: true, output: result })
  } catch (error) {
    logger.error('File write failed', { error })
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'File write failed' },
      { status: 500 }
    )
  }
}
