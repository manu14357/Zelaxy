import SftpClient from 'ssh2-sftp-client'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('SftpRoute')

export interface SftpConnectionInput {
  host?: string
  port?: number | string
  username?: string
  password?: string
  privateKey?: string
  passphrase?: string
}

/** Fields common to every SFTP tool request. */
export function validateConnection(params: SftpConnectionInput): string[] {
  const errors: string[] = []
  if (!params.host || typeof params.host !== 'string') {
    errors.push('SFTP host is required')
  }
  if (!params.username || typeof params.username !== 'string') {
    errors.push('SSH username is required')
  }
  if (!params.password && !params.privateKey) {
    errors.push('Either a password or a private key is required')
  }
  return errors
}

/**
 * Open an SFTP connection using ssh2-sftp-client.
 *
 * ssh2/ssh2-sftp-client are node-only (raw TCP + crypto) and cannot go through Zelaxy's HTTP
 * proxy — that is why the SFTP tools POST here and this route drives the node client directly.
 * Callers MUST `await client.end()` in a finally block.
 */
export async function connectSftp(params: SftpConnectionInput): Promise<SftpClient> {
  const client = new SftpClient()
  const port = params.port ? Number(params.port) : 22

  await client.connect({
    host: params.host,
    port,
    username: params.username,
    password: params.password || undefined,
    privateKey: params.privateKey || undefined,
    passphrase: params.passphrase || undefined,
    readyTimeout: 15000,
  })

  return client
}

/** Turn a caught error into a helpful, user-facing message. */
export function describeSftpError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown error occurred'
  let hint = ''
  if (message.includes('ECONNREFUSED')) {
    hint = ' (Check the SFTP host and port, and that the server is reachable)'
  } else if (
    message.includes('All configured authentication methods failed') ||
    message.includes('authentication')
  ) {
    hint = ' (Check your username, password, or private key)'
  } else if (message.includes('ENOTFOUND') || message.includes('getaddrinfo')) {
    hint = ' (Host could not be resolved — check the hostname)'
  } else if (message.includes('ETIMEDOUT') || message.includes('Timed out')) {
    hint = ' (Connection timed out — check host, port, and network reachability)'
  } else if (message.includes('No such file') || message.includes('ENOENT')) {
    hint = ' (The remote path does not exist)'
  } else if (message.includes('Permission denied') || message.includes('EACCES')) {
    hint = ' (Permission denied on the remote path)'
  }
  logger.error('SFTP operation failed', { message })
  return `SFTP Error: ${message}${hint}`
}
