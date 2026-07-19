import type { ToolConfig } from '@/tools/types'
import { sftpConnectionParams } from './common'
import type { SftpMkdirParams, SftpMkdirResponse } from './types'

export const sftpMkdirTool: ToolConfig<SftpMkdirParams, SftpMkdirResponse> = {
  id: 'sftp_mkdir',
  name: 'SFTP Make Directory',
  description: 'Create a directory on an SFTP server',
  version: '1.0.0',

  params: {
    ...sftpConnectionParams,
    path: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Remote directory path to create (e.g. /home/user/new-folder)',
    },
    recursive: {
      type: 'boolean',
      required: false,
      default: true,
      visibility: 'user-only',
      description: 'Create parent directories as needed (like mkdir -p)',
    },
  },

  outputs: {
    path: { type: 'string', description: 'The remote directory that was created' },
    status: { type: 'string', description: 'Result status message' },
    error: { type: 'string', description: 'Error message if the operation failed', optional: true },
  },

  request: {
    url: '/api/tools/sftp/mkdir',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params: SftpMkdirParams) => ({ ...params }),
  },

  transformResponse: async (response: Response): Promise<SftpMkdirResponse> => {
    try {
      if (!response.ok) {
        return {
          success: false,
          output: { error: `HTTP ${response.status}: ${response.statusText}` },
        }
      }
      return (await response.json()) as SftpMkdirResponse
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
