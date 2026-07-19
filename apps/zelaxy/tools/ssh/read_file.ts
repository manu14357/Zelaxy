import type { ToolConfig } from '@/tools/types'
import type { SshReadFileParams, SshReadFileResponse } from './types'
import { connectionBody, SSH_ROUTE, sshConnectionParams, transformSshResponse } from './utils'

export const sshReadFileTool: ToolConfig<SshReadFileParams, SshReadFileResponse> = {
  id: 'ssh_read_file',
  name: 'SSH Read File',
  description: 'Read the contents of a remote file over SFTP',
  version: '1.0.0',

  params: {
    ...sshConnectionParams,
    path: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Absolute path of the remote file to read',
    },
    encoding: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      default: 'utf8',
      description: "Encoding for the returned content: 'utf8' or 'base64'",
    },
  },

  outputs: {
    path: { type: 'string', description: 'Path of the file that was read' },
    content: { type: 'string', description: 'File contents in the requested encoding' },
    size: { type: 'number', description: 'Size of the file in bytes' },
    encoding: { type: 'string', description: 'Encoding used for the content' },
  },

  request: {
    url: SSH_ROUTE,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      ...connectionBody(params),
      operation: 'read_file',
      path: params.path,
      encoding: params.encoding,
    }),
  },

  transformResponse: transformSshResponse as (r: Response) => Promise<SshReadFileResponse>,
}
