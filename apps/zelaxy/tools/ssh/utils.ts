import type { ToolConfig, ToolResponse } from '@/tools/types'
import type { SshConnectionParams } from './types'

/**
 * The `/api/tools/ssh` route opens the SSH connection with the `ssh2` node
 * client. Every SSH tool POSTs to that one route; the `operation` field tells
 * the route which action to run.
 */
export const SSH_ROUTE = '/api/tools/ssh'

/** Parameter schema entries shared by every SSH tool. */
export const sshConnectionParams: ToolConfig['params'] = {
  host: {
    type: 'string',
    required: true,
    visibility: 'user-only',
    description: 'SSH server hostname or IP address',
  },
  port: {
    type: 'number',
    required: false,
    visibility: 'user-only',
    default: 22,
    description: 'SSH port (default: 22)',
  },
  username: {
    type: 'string',
    required: true,
    visibility: 'user-only',
    description: 'SSH username',
  },
  password: {
    type: 'string',
    required: false,
    visibility: 'user-only',
    description: 'SSH password (use this or privateKey)',
  },
  privateKey: {
    type: 'string',
    required: false,
    visibility: 'user-only',
    description: 'Private key in PEM format (use this or password)',
  },
  passphrase: {
    type: 'string',
    required: false,
    visibility: 'user-only',
    description: 'Passphrase protecting the private key (if any)',
  },
}

/** Pick the connection fields off an arbitrary SSH param object. */
export function connectionBody(params: SshConnectionParams): Record<string, any> {
  return {
    host: params.host,
    port: params.port,
    username: params.username,
    password: params.password,
    privateKey: params.privateKey,
    passphrase: params.passphrase,
  }
}

/** Shared response transform for all SSH tools. */
export async function transformSshResponse(response: Response): Promise<ToolResponse> {
  try {
    const result = (await response.json()) as ToolResponse
    if (!response.ok) {
      return {
        success: false,
        output: result?.output ?? {},
        error: result?.error ?? `HTTP ${response.status}: ${response.statusText}`,
      }
    }
    return result
  } catch (error) {
    return {
      success: false,
      output: {},
      error: `Failed to parse SSH response: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    }
  }
}
