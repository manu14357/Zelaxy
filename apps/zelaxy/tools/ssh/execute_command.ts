import type { ToolConfig } from '@/tools/types'
import type { SshCommandResponse, SshExecuteCommandParams } from './types'
import { connectionBody, SSH_ROUTE, sshConnectionParams, transformSshResponse } from './utils'

export const sshExecuteCommandTool: ToolConfig<SshExecuteCommandParams, SshCommandResponse> = {
  id: 'ssh_execute_command',
  name: 'SSH Execute Command',
  description: 'Run a single shell command on a remote host over SSH and capture its output',
  version: '1.0.0',

  params: {
    ...sshConnectionParams,
    command: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Shell command to execute on the remote host',
    },
  },

  outputs: {
    stdout: { type: 'string', description: 'Standard output of the command' },
    stderr: { type: 'string', description: 'Standard error output of the command' },
    code: { type: 'number', description: 'Exit code of the command', optional: true },
    signal: { type: 'string', description: 'Signal that terminated the command', optional: true },
    command: { type: 'string', description: 'The command that was executed', optional: true },
  },

  request: {
    url: SSH_ROUTE,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      ...connectionBody(params),
      operation: 'execute_command',
      command: params.command,
    }),
  },

  transformResponse: transformSshResponse as (r: Response) => Promise<SshCommandResponse>,
}
