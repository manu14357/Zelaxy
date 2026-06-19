import { createLogger } from '@/lib/logs/console/logger'
import type { ToolConfig } from '@/tools/types'

const logger = createLogger('FileAppendTool')

interface FileAppendParams {
  workspaceId?: string
  fileName: string
  content: string
}

interface FileAppendOutput {
  success: boolean
  output: { id: string; name: string; size: number; type: string; url: string }
}

export const fileAppendTool: ToolConfig<FileAppendParams, FileAppendOutput> = {
  id: 'file_append',
  name: 'File Append',
  description: 'Append text to the end of an existing workspace file (creates it if absent).',
  version: '1.0.0',

  params: {
    fileName: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Name of the existing workspace file to append to',
    },
    content: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Text to add to the end of the file',
    },
    workspaceId: {
      type: 'string',
      required: false,
      visibility: 'hidden',
      description: 'Workspace containing the file (from execution context)',
    },
  },

  request: {
    url: '/api/files/append',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      workspaceId: params.workspaceId,
      fileName: params.fileName,
      content: params.content,
    }),
  },

  transformResponse: async (response: Response): Promise<FileAppendOutput> => {
    const result = await response.json()
    if (!result.success) {
      logger.error('File append failed', { error: result.error })
      throw new Error(result.error || 'File append failed')
    }
    return { success: true, output: result.output }
  },

  outputs: {
    id: { type: 'string', description: 'Workspace file ID' },
    name: { type: 'string', description: 'File name' },
    size: { type: 'number', description: 'New file size in bytes' },
    type: { type: 'string', description: 'MIME type' },
    url: { type: 'string', description: 'URL to access the file' },
  },
}
