import type { ToolConfig } from '@/tools/types'
import type { SshListDirectoryParams, SshListDirectoryResponse } from './types'
import { connectionBody, SSH_ROUTE, sshConnectionParams, transformSshResponse } from './utils'

export const sshListDirectoryTool: ToolConfig<SshListDirectoryParams, SshListDirectoryResponse> = {
  id: 'ssh_list_directory',
  name: 'SSH List Directory',
  description: 'List the entries of a remote directory over SFTP',
  version: '1.0.0',

  params: {
    ...sshConnectionParams,
    path: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Absolute path of the remote directory to list',
    },
  },

  outputs: {
    path: { type: 'string', description: 'Path of the listed directory' },
    entries: { type: 'array', description: 'Directory entries with name, size, mode and type' },
    count: { type: 'number', description: 'Number of entries returned' },
  },

  request: {
    url: SSH_ROUTE,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      ...connectionBody(params),
      operation: 'list_directory',
      path: params.path,
    }),
  },

  transformResponse: transformSshResponse as (r: Response) => Promise<SshListDirectoryResponse>,
}
