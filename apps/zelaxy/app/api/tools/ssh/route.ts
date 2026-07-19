import { type NextRequest, NextResponse } from 'next/server'
import { Client, type ConnectConfig, type SFTPWrapper, type Stats } from 'ssh2'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('SshToolAPI')

// SSH connections can be slow to establish; give them a generous window but
// never hang a request forever.
const READY_TIMEOUT_MS = 20000

interface SshRequestBody {
  operation: string
  host: string
  port?: number | string
  username: string
  password?: string | null
  privateKey?: string | null
  passphrase?: string | null
  // operation-specific
  command?: string
  script?: string
  path?: string
  content?: string
  newPath?: string
  mode?: string
  recursive?: boolean
  encoding?: 'utf8' | 'base64'
}

function buildConnectConfig(body: SshRequestBody): ConnectConfig {
  const port = body.port ? Number.parseInt(String(body.port), 10) : 22
  const config: ConnectConfig = {
    host: body.host,
    port: Number.isNaN(port) ? 22 : port,
    username: body.username,
    readyTimeout: READY_TIMEOUT_MS,
  }
  if (body.privateKey) {
    config.privateKey = body.privateKey
    if (body.passphrase) config.passphrase = body.passphrase
  } else if (body.password) {
    config.password = body.password
  }
  return config
}

function connect(config: ConnectConfig): Promise<Client> {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    conn
      .on('ready', () => resolve(conn))
      .on('error', (err: Error) => reject(err))
      .connect(config)
  })
}

function execCommand(
  conn: Client,
  command: string
): Promise<{ stdout: string; stderr: string; code: number | null; signal: string | null }> {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err)
      let stdout = ''
      let stderr = ''
      stream
        .on('close', (code: number | null, signal: string | null) => {
          resolve({ stdout, stderr, code: code ?? null, signal: signal ?? null })
        })
        .on('data', (data: Buffer) => {
          stdout += data.toString('utf8')
        })
      stream.stderr.on('data', (data: Buffer) => {
        stderr += data.toString('utf8')
      })
    })
  })
}

function getSftp(conn: Client): Promise<SFTPWrapper> {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err)
      resolve(sftp)
    })
  })
}

function statToInfo(path: string, stats: Stats) {
  return {
    path,
    size: stats.size,
    mode: stats.mode,
    modeOctal: (stats.mode & 0o777).toString(8).padStart(3, '0'),
    uid: stats.uid,
    gid: stats.gid,
    accessTime: stats.atime,
    modifyTime: stats.mtime,
    isDirectory: stats.isDirectory(),
    isFile: stats.isFile(),
    isSymbolicLink: stats.isSymbolicLink(),
  }
}

async function runOperation(conn: Client, body: SshRequestBody): Promise<Record<string, any>> {
  switch (body.operation) {
    case 'execute_command': {
      if (!body.command) throw new Error('command is required for execute_command')
      const r = await execCommand(conn, body.command)
      return { ...r, command: body.command }
    }
    case 'run_script': {
      if (!body.script) throw new Error('script is required for run_script')
      const r = await execCommand(conn, body.script)
      return { ...r }
    }
    case 'read_file': {
      if (!body.path) throw new Error('path is required for read_file')
      const sftp = await getSftp(conn)
      const data = await new Promise<Buffer>((resolve, reject) => {
        sftp.readFile(body.path as string, (err, d) => (err ? reject(err) : resolve(d)))
      })
      const encoding = body.encoding === 'base64' ? 'base64' : 'utf8'
      return { path: body.path, content: data.toString(encoding), size: data.length, encoding }
    }
    case 'write_file': {
      if (!body.path) throw new Error('path is required for write_file')
      const sftp = await getSftp(conn)
      const encoding = body.encoding === 'base64' ? 'base64' : 'utf8'
      const buf = Buffer.from(body.content ?? '', encoding)
      await new Promise<void>((resolve, reject) => {
        sftp.writeFile(body.path as string, buf, (err) => (err ? reject(err) : resolve()))
      })
      return { path: body.path, bytesWritten: buf.length }
    }
    case 'append_file': {
      if (!body.path) throw new Error('path is required for append_file')
      const sftp = await getSftp(conn)
      const encoding = body.encoding === 'base64' ? 'base64' : 'utf8'
      const buf = Buffer.from(body.content ?? '', encoding)
      await new Promise<void>((resolve, reject) => {
        sftp.appendFile(body.path as string, buf, (err) => (err ? reject(err) : resolve()))
      })
      return { path: body.path, bytesAppended: buf.length }
    }
    case 'delete_file': {
      if (!body.path) throw new Error('path is required for delete_file')
      const sftp = await getSftp(conn)
      await new Promise<void>((resolve, reject) => {
        sftp.unlink(body.path as string, (err) => (err ? reject(err) : resolve()))
      })
      return { path: body.path, deleted: true }
    }
    case 'rename': {
      if (!body.path) throw new Error('path is required for rename')
      if (!body.newPath) throw new Error('newPath is required for rename')
      const sftp = await getSftp(conn)
      await new Promise<void>((resolve, reject) => {
        sftp.rename(body.path as string, body.newPath as string, (err) =>
          err ? reject(err) : resolve()
        )
      })
      return { path: body.path, newPath: body.newPath, renamed: true }
    }
    case 'file_stat': {
      if (!body.path) throw new Error('path is required for file_stat')
      const sftp = await getSftp(conn)
      const stats = await new Promise<Stats>((resolve, reject) => {
        sftp.stat(body.path as string, (err, s) => (err ? reject(err) : resolve(s)))
      })
      return { info: statToInfo(body.path, stats) }
    }
    case 'change_permissions': {
      if (!body.path) throw new Error('path is required for change_permissions')
      if (!body.mode) throw new Error('mode is required for change_permissions')
      const sftp = await getSftp(conn)
      const mode = Number.parseInt(body.mode, 8)
      if (Number.isNaN(mode)) throw new Error(`Invalid octal mode: ${body.mode}`)
      await new Promise<void>((resolve, reject) => {
        sftp.chmod(body.path as string, mode, (err) => (err ? reject(err) : resolve()))
      })
      return { path: body.path, mode: body.mode }
    }
    case 'list_directory': {
      if (!body.path) throw new Error('path is required for list_directory')
      const sftp = await getSftp(conn)
      const list = await new Promise<any[]>((resolve, reject) => {
        sftp.readdir(body.path as string, (err, l) => (err ? reject(err) : resolve(l)))
      })
      const entries = list.map((e) => ({
        name: e.filename,
        longname: e.longname,
        size: e.attrs.size,
        mode: e.attrs.mode,
        modeOctal: (e.attrs.mode & 0o777).toString(8).padStart(3, '0'),
        isDirectory: e.attrs.isDirectory(),
        isFile: e.attrs.isFile(),
        modifyTime: e.attrs.mtime,
      }))
      return { path: body.path, entries, count: entries.length }
    }
    case 'create_directory': {
      if (!body.path) throw new Error('path is required for create_directory')
      const sftp = await getSftp(conn)
      if (body.recursive) {
        const parts = body.path.split('/').filter(Boolean)
        const absolute = body.path.startsWith('/')
        let current = absolute ? '' : '.'
        for (const part of parts) {
          current = current ? `${current}/${part}` : absolute ? `/${part}` : part
          await new Promise<void>((resolve) => {
            // Ignore "already exists" style errors on intermediate segments.
            sftp.mkdir(current, () => resolve())
          })
        }
      } else {
        await new Promise<void>((resolve, reject) => {
          sftp.mkdir(body.path as string, (err) => (err ? reject(err) : resolve()))
        })
      }
      return { path: body.path, created: true }
    }
    case 'remove_directory': {
      if (!body.path) throw new Error('path is required for remove_directory')
      const sftp = await getSftp(conn)
      if (body.recursive) {
        // rmdir only removes empty dirs; use a shell rm -rf for recursive removal.
        const r = await execCommand(conn, `rm -rf ${JSON.stringify(body.path)}`)
        if (r.code && r.code !== 0) throw new Error(r.stderr || `rm -rf exited with code ${r.code}`)
      } else {
        await new Promise<void>((resolve, reject) => {
          sftp.rmdir(body.path as string, (err) => (err ? reject(err) : resolve()))
        })
      }
      return { path: body.path, removed: true }
    }
    case 'check_exists': {
      if (!body.path) throw new Error('path is required for check_exists')
      const sftp = await getSftp(conn)
      const exists = await new Promise<boolean>((resolve) => {
        sftp.stat(body.path as string, (err) => resolve(!err))
      })
      return { path: body.path, exists }
    }
    default:
      throw new Error(`Unsupported SSH operation: ${body.operation}`)
  }
}

export async function POST(request: NextRequest) {
  let body: SshRequestBody
  try {
    body = (await request.json()) as SshRequestBody
  } catch {
    return NextResponse.json({ success: false, output: {}, error: 'Invalid JSON body' })
  }

  if (!body.host) {
    return NextResponse.json({ success: false, output: {}, error: 'host is required' })
  }
  if (!body.username) {
    return NextResponse.json({ success: false, output: {}, error: 'username is required' })
  }
  if (!body.password && !body.privateKey) {
    return NextResponse.json({
      success: false,
      output: {},
      error: 'Either password or privateKey is required',
    })
  }

  let conn: Client | null = null
  try {
    conn = await connect(buildConnectConfig(body))
    const output = await runOperation(conn, body)
    return NextResponse.json({ success: true, output })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown SSH error'
    logger.error('SSH operation failed', {
      operation: body.operation,
      host: body.host,
      error: message,
    })
    return NextResponse.json({ success: false, output: {}, error: message })
  } finally {
    try {
      conn?.end()
    } catch {
      // ignore errors closing the connection
    }
  }
}
