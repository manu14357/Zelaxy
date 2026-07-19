import type { ToolConfig } from '@/tools/types'
import type { SshWriteFileParams, SshWriteFileResponse } from './types'
import { connectionBody, SSH_ROUTE, sshConnectionParams, transformSshResponse } from './utils'

export const sshWriteFileTool: ToolConfig<SshWriteFileParams, SshWriteFileResponse> = {
  id: 'ssh_write_file',
  name: 'SSH Write File',
  description: 'Write content to a remote file over SFTP, creating or overwriting it',
  version: '1.0.0',

  params: {
    ...sshConnectionParams,
    path: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Absolute path of the remote file to write',
    },
    content: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Content to write to the file',
    },
    encoding: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      default: 'utf8',
      description: "Encoding of the provided content: 'utf8' or 'base64'",
    },
  },

  outputs: {
    path: { type: 'string', description: 'Path of the file that was written' },
    bytesWritten: { type: 'number', description: 'Number of bytes written' },
  },

  request: {
    url: SSH_ROUTE,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      ...connectionBody(params),
      operation: 'write_file',
      path: params.path,
      content: params.content,
      encoding: params.encoding,
    }),
  },

  transformResponse: transformSshResponse as (r: Response) => Promise<SshWriteFileResponse>,
}
