import type { ToolConfig } from '@/tools/types'
import type { SshCreateDirectoryParams, SshCreateDirectoryResponse } from './types'
import { connectionBody, SSH_ROUTE, sshConnectionParams, transformSshResponse } from './utils'

export const sshCreateDirectoryTool: ToolConfig<
  SshCreateDirectoryParams,
  SshCreateDirectoryResponse
> = {
  id: 'ssh_create_directory',
  name: 'SSH Create Directory',
  description: 'Create a remote directory over SFTP, optionally creating parent directories',
  version: '1.0.0',

  params: {
    ...sshConnectionParams,
    path: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Absolute path of the remote directory to create',
    },
    recursive: {
      type: 'boolean',
      required: false,
      visibility: 'user-only',
      default: false,
      description: 'Create parent directories as needed (mkdir -p)',
    },
  },

  outputs: {
    path: { type: 'string', description: 'Path of the created directory' },
    created: { type: 'boolean', description: 'Whether the directory was created' },
  },

  request: {
    url: SSH_ROUTE,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      ...connectionBody(params),
      operation: 'create_directory',
      path: params.path,
      recursive: params.recursive,
    }),
  },

  transformResponse: transformSshResponse as (r: Response) => Promise<SshCreateDirectoryResponse>,
}
