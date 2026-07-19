// Minimal ambient declaration for the `ssh2` package.
//
// `ssh2` is installed at runtime (used by the /api/tools/ssh route) but ships
// no bundled type declarations. Rather than depend on `@types/ssh2` (which would
// conflict with this declaration if both were present), we declare the small
// surface the SSH tool route actually uses. If `@types/ssh2` is ever added,
// delete this file.
declare module 'ssh2' {
  import type { EventEmitter } from 'node:events'

  export interface ConnectConfig {
    host?: string
    port?: number
    username?: string
    password?: string
    privateKey?: string | Buffer
    passphrase?: string
    readyTimeout?: number
    [key: string]: any
  }

  export interface Stats {
    mode: number
    uid: number
    gid: number
    size: number
    atime: number
    mtime: number
    isDirectory(): boolean
    isFile(): boolean
    isSymbolicLink(): boolean
    [key: string]: any
  }

  export interface FileEntry {
    filename: string
    longname: string
    attrs: Stats
  }

  export interface SFTPWrapper {
    readFile(path: string, options: any, cb: (err: any, data: Buffer) => void): void
    readFile(path: string, cb: (err: any, data: Buffer) => void): void
    writeFile(path: string, data: string | Buffer, options: any, cb: (err: any) => void): void
    writeFile(path: string, data: string | Buffer, cb: (err: any) => void): void
    appendFile(path: string, data: string | Buffer, options: any, cb: (err: any) => void): void
    appendFile(path: string, data: string | Buffer, cb: (err: any) => void): void
    unlink(path: string, cb: (err: any) => void): void
    rename(srcPath: string, destPath: string, cb: (err: any) => void): void
    mkdir(path: string, cb: (err: any) => void): void
    rmdir(path: string, cb: (err: any) => void): void
    readdir(location: string, cb: (err: any, list: FileEntry[]) => void): void
    stat(path: string, cb: (err: any, stats: Stats) => void): void
    chmod(path: string, mode: number | string, cb: (err: any) => void): void
    [key: string]: any
  }

  export interface ClientChannel extends EventEmitter {
    stderr: EventEmitter
    [key: string]: any
  }

  export class Client extends EventEmitter {
    connect(config: ConnectConfig): this
    exec(command: string, cb: (err: any, channel: ClientChannel) => void): boolean
    sftp(cb: (err: any, sftp: SFTPWrapper) => void): boolean
    end(): this
  }
}
