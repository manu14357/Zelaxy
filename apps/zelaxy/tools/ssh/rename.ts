import type { ToolConfig } from '@/tools/types'
import type { SshRenameParams, SshRenameResponse } from './types'
import { connectionBody, SSH_ROUTE, sshConnectionParams, transformSshResponse } from './utils'

export const sshRenameTool: ToolConfig<SshRenameParams, SshRenameResponse> = {
  id: 'ssh_rename',
  name: 'SSH Rename',
  description: 'Rename or move a remote file or directory over SFTP',
  version: '1.0.0',

  params: {
    ...sshConnectionParams,
    path: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Current absolute path of the remote file or directory',
    },
    newPath: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'New absolute path (destination)',
    },
  },

  outputs: {
    path: { type: 'string', description: 'Original path' },
    newPath: { type: 'string', description: 'New path' },
    renamed: { type: 'boolean', description: 'Whether the rename succeeded' },
  },

  request: {
    url: SSH_ROUTE,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      ...connectionBody(params),
      operation: 'rename',
      path: params.path,
      newPath: params.newPath,
    }),
  },

  transformResponse: transformSshResponse as (r: Response) => Promise<SshRenameResponse>,
}
