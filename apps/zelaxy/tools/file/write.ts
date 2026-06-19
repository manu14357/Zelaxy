import { createLogger } from '@/lib/logs/console/logger'
import type { ToolConfig } from '@/tools/types'

const logger = createLogger('FileWriteTool')

interface FileWriteParams {
  workspaceId?: string
  fileName: string
  content: string
  contentType?: string
}

interface FileWriteOutput {
  success: boolean
  output: { id: string; name: string; size: number; type: string; url: string }
}

export const fileWriteTool: ToolConfig<FileWriteParams, FileWriteOutput> = {
  id: 'file_write',
  name: 'File Write',
  description: 'Create a new workspace file from text content.',
  version: '1.0.0',

  params: {
    fileName: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Name of the file to create (e.g. summary.md)',
    },
    content: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Text content to write to the file',
    },
    contentType: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'MIME type (auto-detected from the extension if omitted)',
    },
    workspaceId: {
      type: 'string',
      required: false,
      visibility: 'hidden',
      description: 'Workspace to write the file into (from execution context)',
    },
  },

  request: {
    url: '/api/files/write',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      workspaceId: params.workspaceId,
      fileName: params.fileName,
      content: params.content,
      contentType: params.contentType,
    }),
  },

  transformResponse: async (response: Response): Promise<FileWriteOutput> => {
    const result = await response.json()
    if (!result.success) {
      logger.error('File write failed', { error: result.error })
      throw new Error(result.error || 'File write failed')
    }
    return { success: true, output: result.output }
  },

  outputs: {
    id: { type: 'string', description: 'Workspace file ID' },
    name: { type: 'string', description: 'Final file name (after dedup)' },
    size: { type: 'number', description: 'File size in bytes' },
    type: { type: 'string', description: 'MIME type' },
    url: { type: 'string', description: 'URL to access the file' },
  },
}
