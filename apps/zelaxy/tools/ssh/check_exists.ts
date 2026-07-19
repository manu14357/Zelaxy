import type { ToolConfig } from '@/tools/types'
import type { SshCheckExistsParams, SshCheckExistsResponse } from './types'
import { connectionBody, SSH_ROUTE, sshConnectionParams, transformSshResponse } from './utils'

export const sshCheckExistsTool: ToolConfig<SshCheckExistsParams, SshCheckExistsResponse> = {
  id: 'ssh_check_exists',
  name: 'SSH Check Exists',
  description: 'Check whether a remote file or directory exists over SFTP',
  version: '1.0.0',

  params: {
    ...sshConnectionParams,
    path: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Absolute path of the remote file or directory to check',
    },
  },

  outputs: {
    path: { type: 'string', description: 'Path that was checked' },
    exists: { type: 'boolean', description: 'Whether the path exists' },
  },

  request: {
    url: SSH_ROUTE,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      ...connectionBody(params),
      operation: 'check_exists',
      path: params.path,
    }),
  },

  transformResponse: transformSshResponse as (r: Response) => Promise<SshCheckExistsResponse>,
}
