import type { ToolConfig } from '@/tools/types'
import type { SshFileStatParams, SshFileStatResponse } from './types'
import { connectionBody, SSH_ROUTE, sshConnectionParams, transformSshResponse } from './utils'

export const sshFileStatTool: ToolConfig<SshFileStatParams, SshFileStatResponse> = {
  id: 'ssh_file_stat',
  name: 'SSH File Stat',
  description: 'Get metadata (size, permissions, timestamps) for a remote path over SFTP',
  version: '1.0.0',

  params: {
    ...sshConnectionParams,
    path: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Absolute path of the remote file or directory',
    },
  },

  outputs: {
    info: { type: 'object', description: 'File metadata (size, mode, uid/gid, timestamps, type)' },
  },

  request: {
    url: SSH_ROUTE,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      ...connectionBody(params),
      operation: 'file_stat',
      path: params.path,
    }),
  },

  transformResponse: transformSshResponse as (r: Response) => Promise<SshFileStatResponse>,
}
