import type { ToolConfig } from '@/tools/types'
import type { SshAppendFileParams, SshAppendFileResponse } from './types'
import { connectionBody, SSH_ROUTE, sshConnectionParams, transformSshResponse } from './utils'

export const sshAppendFileTool: ToolConfig<SshAppendFileParams, SshAppendFileResponse> = {
  id: 'ssh_append_file',
  name: 'SSH Append File',
  description: 'Append content to the end of a remote file over SFTP',
  version: '1.0.0',

  params: {
    ...sshConnectionParams,
    path: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Absolute path of the remote file to append to',
    },
    content: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Content to append to the file',
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
    path: { type: 'string', description: 'Path of the file that was appended to' },
    bytesAppended: { type: 'number', description: 'Number of bytes appended' },
  },

  request: {
    url: SSH_ROUTE,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      ...connectionBody(params),
      operation: 'append_file',
      path: params.path,
      content: params.content,
      encoding: params.encoding,
    }),
  },

  transformResponse: transformSshResponse as (r: Response) => Promise<SshAppendFileResponse>,
}
