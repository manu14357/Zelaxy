import type { ToolConfig } from '@/tools/types'
import { sftpConnectionParams } from './common'
import type { SftpGetParams, SftpGetResponse } from './types'

export const sftpGetTool: ToolConfig<SftpGetParams, SftpGetResponse> = {
  id: 'sftp_get',
  name: 'SFTP Download File',
  description: 'Download (read) a file from an SFTP server and return its contents',
  version: '1.0.0',

  params: {
    ...sftpConnectionParams,
    path: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Remote file path to download (e.g. /home/user/report.csv)',
    },
    encoding: {
      type: 'string',
      required: false,
      default: 'utf8',
      visibility: 'user-only',
      description: "Output encoding: 'utf8' for text or 'base64' for binary files",
    },
  },

  outputs: {
    path: { type: 'string', description: 'The remote file that was downloaded' },
    content: { type: 'string', description: 'File contents in the requested encoding' },
    encoding: {
      type: 'string',
      description: "Encoding of the returned content ('utf8' | 'base64')",
    },
    size: { type: 'number', description: 'Size of the file in bytes' },
    error: { type: 'string', description: 'Error message if the operation failed', optional: true },
  },

  request: {
    url: '/api/tools/sftp/get',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params: SftpGetParams) => ({ ...params }),
  },

  transformResponse: async (response: Response): Promise<SftpGetResponse> => {
    try {
      if (!response.ok) {
        return {
          success: false,
          output: { error: `HTTP ${response.status}: ${response.statusText}` },
        }
      }
      return (await response.json()) as SftpGetResponse
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
