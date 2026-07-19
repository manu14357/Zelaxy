import type { ToolConfig } from '@/tools/types'
import { sftpConnectionParams } from './common'
import type { SftpPutParams, SftpPutResponse } from './types'

export const sftpPutTool: ToolConfig<SftpPutParams, SftpPutResponse> = {
  id: 'sftp_put',
  name: 'SFTP Upload File',
  description: 'Upload (write) content to a file on an SFTP server',
  version: '1.0.0',

  params: {
    ...sftpConnectionParams,
    path: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Remote destination file path (e.g. /home/user/upload.txt)',
    },
    content: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Content to write to the remote file',
    },
    encoding: {
      type: 'string',
      required: false,
      default: 'utf8',
      visibility: 'user-only',
      description: "Encoding of the provided content: 'utf8' for text or 'base64' for binary",
    },
  },

  outputs: {
    path: { type: 'string', description: 'The remote path that was written' },
    bytesWritten: { type: 'number', description: 'Number of bytes written' },
    status: { type: 'string', description: 'Result status message' },
    error: { type: 'string', description: 'Error message if the operation failed', optional: true },
  },

  request: {
    url: '/api/tools/sftp/put',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params: SftpPutParams) => ({ ...params }),
  },

  transformResponse: async (response: Response): Promise<SftpPutResponse> => {
    try {
      if (!response.ok) {
        return {
          success: false,
          output: { error: `HTTP ${response.status}: ${response.statusText}` },
        }
      }
      return (await response.json()) as SftpPutResponse
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
