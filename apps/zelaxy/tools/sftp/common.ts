import type { ToolConfig } from '@/tools/types'

/**
 * Connection parameters shared by every SFTP operation tool.
 *
 * These are marked `user-only` — they are credentials/host config the user supplies in the
 * block, never something the LLM should invent when calling the tool.
 */
export const sftpConnectionParams: ToolConfig['params'] = {
  host: {
    type: 'string',
    required: true,
    visibility: 'user-only',
    description: 'SFTP server hostname or IP address',
  },
  port: {
    type: 'number',
    required: false,
    default: 22,
    visibility: 'user-only',
    description: 'SFTP server port (default: 22)',
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
    description: 'SSH password (omit if using a private key)',
  },
  privateKey: {
    type: 'string',
    required: false,
    visibility: 'user-only',
    description: 'PEM-encoded SSH private key (omit if using a password)',
  },
  passphrase: {
    type: 'string',
    required: false,
    visibility: 'user-only',
    description: 'Passphrase for the encrypted private key, if any',
  },
}
