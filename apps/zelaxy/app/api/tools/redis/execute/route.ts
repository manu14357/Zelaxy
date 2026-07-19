import Redis from 'ioredis'
import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('RedisExecuteAPI')

interface RedisConnectionBody {
  host?: string
  port?: number | string
  password?: string
  username?: string
  db?: number | string
  tls?: boolean
}

interface RedisExecuteBody {
  connection?: RedisConnectionBody
  command?: string
  args?: Array<string | number>
}

export async function POST(request: NextRequest) {
  let client: Redis | null = null

  try {
    const body: RedisExecuteBody = await request.json()
    const { connection, command, args } = body

    if (!connection?.host) {
      return NextResponse.json({ success: false, error: 'Redis host is required' }, { status: 400 })
    }

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Redis command is required' },
        { status: 400 }
      )
    }

    const port =
      connection.port === undefined || connection.port === ''
        ? 6379
        : Number.parseInt(String(connection.port), 10)
    const db =
      connection.db === undefined || connection.db === ''
        ? 0
        : Number.parseInt(String(connection.db), 10)

    // Single connection per request. lazyConnect defers the socket until connect()
    // so a failure surfaces here instead of as an unhandled error event.
    client = new Redis({
      host: connection.host,
      port: Number.isNaN(port) ? 6379 : port,
      password: connection.password ? connection.password : undefined,
      username: connection.username ? connection.username : undefined,
      db: Number.isNaN(db) ? 0 : db,
      tls: connection.tls ? {} : undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 10000,
      retryStrategy: () => null,
    })

    await client.connect()

    const commandArgs = Array.isArray(args) ? args.map((a) => String(a)) : []
    const result = await client.call(command.toUpperCase(), ...commandArgs)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Redis error'
    logger.error('Redis command failed', { message })
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  } finally {
    if (client) {
      try {
        await client.quit()
      } catch {
        client.disconnect()
      }
    }
  }
}
