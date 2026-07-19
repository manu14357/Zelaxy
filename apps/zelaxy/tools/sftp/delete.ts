import type { ToolConfig } from '@/tools/types'
import { sftpConnectionParams } from './common'
import type { SftpDeleteParams, SftpDeleteResponse } from './types'

export const sftpDeleteTool: ToolConfig<SftpDeleteParams, SftpDeleteResponse> = {
  id: 'sftp_delete',
  name: 'SFTP Delete File',
  description: 'Delete a file from an SFTP server',
  version: '1.0.0',

  params: {
    ...sftpConnectionParams,
    path: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Remote file path to delete (e.g. /home/user/old.txt)',
    },
  },

  outputs: {
    path: { type: 'string', description: 'The remote path that was deleted' },
    status: { type: 'string', description: 'Result status message' },
    error: { type: 'string', description: 'Error message if the operation failed', optional: true },
  },

  request: {
    url: '/api/tools/sftp/delete',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params: SftpDeleteParams) => ({ ...params }),
  },

  transformResponse: async (response: Response): Promise<SftpDeleteResponse> => {
    try {
      if (!response.ok) {
        return {
          success: false,
          output: { error: `HTTP ${response.status}: ${response.statusText}` },
        }
      }
      return (await response.json()) as SftpDeleteResponse
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
