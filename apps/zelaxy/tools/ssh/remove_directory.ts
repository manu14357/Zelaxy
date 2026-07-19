import type { ToolConfig } from '@/tools/types'
import type { SshRemoveDirectoryParams, SshRemoveDirectoryResponse } from './types'
import { connectionBody, SSH_ROUTE, sshConnectionParams, transformSshResponse } from './utils'

export const sshRemoveDirectoryTool: ToolConfig<
  SshRemoveDirectoryParams,
  SshRemoveDirectoryResponse
> = {
  id: 'ssh_remove_directory',
  name: 'SSH Remove Directory',
  description: 'Remove a remote directory over SFTP, optionally removing its contents recursively',
  version: '1.0.0',

  params: {
    ...sshConnectionParams,
    path: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Absolute path of the remote directory to remove',
    },
    recursive: {
      type: 'boolean',
      required: false,
      visibility: 'user-only',
      default: false,
      description: 'Remove the directory and all of its contents (rm -rf)',
    },
  },

  outputs: {
    path: { type: 'string', description: 'Path of the removed directory' },
    removed: { type: 'boolean', description: 'Whether the directory was removed' },
  },

  request: {
    url: SSH_ROUTE,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      ...connectionBody(params),
      operation: 'remove_directory',
      path: params.path,
      recursive: params.recursive,
    }),
  },

  transformResponse: transformSshResponse as (r: Response) => Promise<SshRemoveDirectoryResponse>,
}
