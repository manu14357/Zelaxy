import type { ToolConfig } from '@/tools/types'
import type { SshDeleteFileParams, SshDeleteFileResponse } from './types'
import { connectionBody, SSH_ROUTE, sshConnectionParams, transformSshResponse } from './utils'

export const sshDeleteFileTool: ToolConfig<SshDeleteFileParams, SshDeleteFileResponse> = {
  id: 'ssh_delete_file',
  name: 'SSH Delete File',
  description: 'Delete a remote file over SFTP',
  version: '1.0.0',

  params: {
    ...sshConnectionParams,
    path: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Absolute path of the remote file to delete',
    },
  },

  outputs: {
    path: { type: 'string', description: 'Path of the deleted file' },
    deleted: { type: 'boolean', description: 'Whether the file was deleted' },
  },

  request: {
    url: SSH_ROUTE,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      ...connectionBody(params),
      operation: 'delete_file',
      path: params.path,
    }),
  },

  transformResponse: transformSshResponse as (r: Response) => Promise<SshDeleteFileResponse>,
}
