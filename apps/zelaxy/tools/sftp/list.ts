import type { ToolConfig } from '@/tools/types'
import { sftpConnectionParams } from './common'
import type { SftpListParams, SftpListResponse } from './types'

export const sftpListTool: ToolConfig<SftpListParams, SftpListResponse> = {
  id: 'sftp_list',
  name: 'SFTP List Directory',
  description: 'List the files and directories at a remote path on an SFTP server',
  version: '1.0.0',

  params: {
    ...sftpConnectionParams,
    path: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Remote directory path to list (e.g. /home/user/uploads)',
    },
  },

  outputs: {
    path: { type: 'string', description: 'The directory that was listed' },
    files: { type: 'array', description: 'Directory entries (name, type, size, modifyTime, ...)' },
    count: { type: 'number', description: 'Number of entries returned' },
    error: { type: 'string', description: 'Error message if the operation failed', optional: true },
  },

  request: {
    url: '/api/tools/sftp/list',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params: SftpListParams) => ({ ...params }),
  },

  transformResponse: async (response: Response): Promise<SftpListResponse> => {
    try {
      if (!response.ok) {
        return {
          success: false,
          output: { error: `HTTP ${response.status}: ${response.statusText}` },
        }
      }
      return (await response.json()) as SftpListResponse
    } catch (error) {
      return {
        success: false,
        output: {
          error: `Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      }
    }
  },
}
