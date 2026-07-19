import type { ToolResponse } from '@/tools/types'

/**
 * Shared SSH/SFTP connection parameters.
 *
 * Auth is either password-based or key-based (privateKey, optionally with a passphrase).
 * At least one of `password` / `privateKey` should be supplied.
 */
export interface SftpConnectionParams {
  host: string
  port?: number
  username: string
  password?: string
  privateKey?: string
  passphrase?: string
}

export interface SftpListParams extends SftpConnectionParams {
  path: string
}

export interface SftpGetParams extends SftpConnectionParams {
  path: string
  /** Output encoding for the file contents. Defaults to 'utf8'. Use 'base64' for binary files. */
  encoding?: 'utf8' | 'base64'
}

export interface SftpPutParams extends SftpConnectionParams {
  path: string
  content: string
  /** Encoding of the provided `content`. Defaults to 'utf8'. Use 'base64' for binary data. */
  encoding?: 'utf8' | 'base64'
}

export interface SftpDeleteParams extends SftpConnectionParams {
  path: string
}

export interface SftpMkdirParams extends SftpConnectionParams {
  path: string
  /** Create parent directories as needed (mkdir -p). Defaults to true. */
  recursive?: boolean
}

/** A single directory entry returned by the list operation. */
export interface SftpFileEntry {
  name: string
  /** '-' file, 'd' directory, 'l' symlink */
  type: string
  size: number
  modifyTime: number
  accessTime: number
  rights?: { user: string; group: string; other: string }
  owner?: number
  group?: number
}

export interface SftpListResponse extends ToolResponse {
  output: {
    path?: string
    files?: SftpFileEntry[]
    count?: number
    error?: string
  }
}

export interface SftpGetResponse extends ToolResponse {
  output: {
    path?: string
    content?: string
    encoding?: string
    size?: number
    error?: string
  }
}

export interface SftpPutResponse extends ToolResponse {
  output: {
    path?: string
    bytesWritten?: number
    status?: string
    error?: string
  }
}

export interface SftpDeleteResponse extends ToolResponse {
  output: {
    path?: string
    status?: string
    error?: string
  }
}

export interface SftpMkdirResponse extends ToolResponse {
  output: {
    path?: string
    status?: string
    error?: string
  }
}

export type SftpResponse =
  | SftpListResponse
  | SftpGetResponse
  | SftpPutResponse
  | SftpDeleteResponse
  | SftpMkdirResponse
