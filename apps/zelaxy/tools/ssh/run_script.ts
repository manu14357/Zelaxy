import type { ToolConfig } from '@/tools/types'
import type { SshCommandResponse, SshRunScriptParams } from './types'
import { connectionBody, SSH_ROUTE, sshConnectionParams, transformSshResponse } from './utils'

export const sshRunScriptTool: ToolConfig<SshRunScriptParams, SshCommandResponse> = {
  id: 'ssh_run_script',
  name: 'SSH Run Script',
  description: 'Execute a multi-line shell script on a remote host over SSH',
  version: '1.0.0',

  params: {
    ...sshConnectionParams,
    script: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Multi-line shell script to run on the remote host',
    },
  },

  outputs: {
    stdout: { type: 'string', description: 'Standard output of the script' },
    stderr: { type: 'string', description: 'Standard error output of the script' },
    code: { type: 'number', description: 'Exit code of the script', optional: true },
    signal: { type: 'string', description: 'Signal that terminated the script', optional: true },
  },

  request: {
    url: SSH_ROUTE,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      ...connectionBody(params),
      operation: 'run_script',
      script: params.script,
    }),
  },

  transformResponse: transformSshResponse as (r: Response) => Promise<SshCommandResponse>,
}
