import type { ToolConfig } from '@/tools/types'
import type { SshChangePermissionsParams, SshChangePermissionsResponse } from './types'
import { connectionBody, SSH_ROUTE, sshConnectionParams, transformSshResponse } from './utils'

export const sshChangePermissionsTool: ToolConfig<
  SshChangePermissionsParams,
  SshChangePermissionsResponse
> = {
  id: 'ssh_change_permissions',
  name: 'SSH Change Permissions',
  description: 'Change the permission mode (chmod) of a remote file or directory over SFTP',
  version: '1.0.0',

  params: {
    ...sshConnectionParams,
    path: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Absolute path of the remote file or directory',
    },
    mode: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: "Octal permission mode, e.g. '755' or '0644'",
    },
  },

  outputs: {
    path: { type: 'string', description: 'Path whose permissions were changed' },
    mode: { type: 'string', description: 'Octal mode that was applied' },
  },

  request: {
    url: SSH_ROUTE,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      ...connectionBody(params),
      operation: 'change_permissions',
      path: params.path,
      mode: params.mode,
    }),
  },

  transformResponse: transformSshResponse as (r: Response) => Promise<SshChangePermissionsResponse>,
}
