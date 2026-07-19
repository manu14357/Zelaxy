import type { ToolResponse } from '@/tools/types'

/** Connection parameters shared by every SSH operation. */
export interface SshConnectionParams {
  host: string
  port?: number
  username: string
  password?: string
  privateKey?: string
  passphrase?: string
}

export interface SshExecuteCommandParams extends SshConnectionParams {
  command: string
}

export interface SshRunScriptParams extends SshConnectionParams {
  script: string
}

export interface SshReadFileParams extends SshConnectionParams {
  path: string
  encoding?: 'utf8' | 'base64'
}

export interface SshWriteFileParams extends SshConnectionParams {
  path: string
  content: string
  encoding?: 'utf8' | 'base64'
}

export interface SshAppendFileParams extends SshConnectionParams {
  path: string
  content: string
  encoding?: 'utf8' | 'base64'
}

export interface SshDeleteFileParams extends SshConnectionParams {
  path: string
}

export interface SshRenameParams extends SshConnectionParams {
  path: string
  newPath: string
}

export interface SshFileStatParams extends SshConnectionParams {
  path: string
}

export interface SshChangePermissionsParams extends SshConnectionParams {
  path: string
  mode: string
}

export interface SshListDirectoryParams extends SshConnectionParams {
  path: string
}

export interface SshCreateDirectoryParams extends SshConnectionParams {
  path: string
  recursive?: boolean
}

export interface SshRemoveDirectoryParams extends SshConnectionParams {
  path: string
  recursive?: boolean
}

export interface SshCheckExistsParams extends SshConnectionParams {
  path: string
}

export interface SshFileInfo {
  path: string
  size: number
  mode: number
  modeOctal: string
  uid: number
  gid: number
  accessTime: number
  modifyTime: number
  isDirectory: boolean
  isFile: boolean
  isSymbolicLink: boolean
}

export interface SshDirectoryEntry {
  name: string
  longname: string
  size: number
  mode: number
  modeOctal: string
  isDirectory: boolean
  isFile: boolean
  modifyTime: number
}

export interface SshCommandResponse extends ToolResponse {
  output: {
    stdout: string
    stderr: string
    code: number | null
    signal: string | null
    command?: string
  }
}

export interface SshReadFileResponse extends ToolResponse {
  output: {
    path: string
    content: string
    size: number
    encoding: string
  }
}

export interface SshWriteFileResponse extends ToolResponse {
  output: {
    path: string
    bytesWritten: number
  }
}

export interface SshAppendFileResponse extends ToolResponse {
  output: {
    path: string
    bytesAppended: number
  }
}

export interface SshDeleteFileResponse extends ToolResponse {
  output: {
    path: string
    deleted: boolean
  }
}

export interface SshRenameResponse extends ToolResponse {
  output: {
    path: string
    newPath: string
    renamed: boolean
  }
}

export interface SshFileStatResponse extends ToolResponse {
  output: {
    info: SshFileInfo
  }
}

export interface SshChangePermissionsResponse extends ToolResponse {
  output: {
    path: string
    mode: string
  }
}

export interface SshListDirectoryResponse extends ToolResponse {
  output: {
    path: string
    entries: SshDirectoryEntry[]
    count: number
  }
}

export interface SshCreateDirectoryResponse extends ToolResponse {
  output: {
    path: string
    created: boolean
  }
}

export interface SshRemoveDirectoryResponse extends ToolResponse {
  output: {
    path: string
    removed: boolean
  }
}

export interface SshCheckExistsResponse extends ToolResponse {
  output: {
    path: string
    exists: boolean
  }
}

export type SshResponse =
  | SshCommandResponse
  | SshReadFileResponse
  | SshWriteFileResponse
  | SshAppendFileResponse
  | SshDeleteFileResponse
  | SshRenameResponse
  | SshFileStatResponse
  | SshChangePermissionsResponse
  | SshListDirectoryResponse
  | SshCreateDirectoryResponse
  | SshRemoveDirectoryResponse
  | SshCheckExistsResponse
