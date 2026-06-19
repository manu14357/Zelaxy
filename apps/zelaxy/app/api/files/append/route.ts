import { type NextRequest, NextResponse } from 'next/server'
import '@/lib/uploads/setup.server'
import { appendWorkspaceFile } from '@/lib/files/workspace-files'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('FileAppendAPI')

export const dynamic = 'force-dynamic'

/**
 * Internal endpoint for the File block's Append operation. Appends text to an existing workspace
 * file (by name); creates it if it doesn't exist yet. Called by the file_append tool.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspaceId, userId, fileName, content } = body || {}

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'No workspace context; cannot append to a workspace file' },
        { status: 400 }
      )
    }
    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json({ success: false, error: 'fileName is required' }, { status: 400 })
    }
    if (content === undefined || content === null) {
      return NextResponse.json({ success: false, error: 'content is required' }, { status: 400 })
    }

    const result = await appendWorkspaceFile({
      workspaceId,
      userId: userId ?? null,
      name: fileName,
      content: typeof content === 'string' ? content : JSON.stringify(content),
    })

    return NextResponse.json({ success: true, output: result })
  } catch (error) {
    logger.error('File append failed', { error })
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'File append failed' },
      { status: 500 }
    )
  }
}
