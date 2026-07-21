import { createServer } from 'http'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import {
  attachRedisAdapter,
  createSocketIOServer,
  type RedisAdapterClients,
} from '@/socket-server/config/socket'
import { assertSchemaCompatibility } from '@/socket-server/database/preflight'
import { setupAllHandlers } from '@/socket-server/handlers'
import { flushAllPendingSubblocks } from '@/socket-server/handlers/subblocks'
import { type AuthenticatedSocket, authenticateSocket } from '@/socket-server/middleware/auth'
import { pruneRoleCache } from '@/socket-server/middleware/permissions'
import { RoomManager } from '@/socket-server/rooms/manager'
import { createHttpHandler } from '@/socket-server/routes/http'

const logger = createLogger('CollaborativeSocketServer')

// Reconcile ghost presence + prune the role-revalidation cache on this cadence.
const REAPER_INTERVAL_MS = 60_000
// Hard cap on graceful shutdown so a stuck close never blocks an orchestrator's restart.
const SHUTDOWN_TIMEOUT_MS = 10_000

async function main() {
  // Fail fast if the database schema is incompatible with this build, before accepting traffic.
  await assertSchemaCompatibility()

  // The internal app→socket bridge (workflow lifecycle + execution log streaming) authenticates with
  // this shared secret. If it's missing the bridge rejects every request with 401 and app-driven
  // realtime updates silently never reach clients — warn loudly rather than fail closed in the dark.
  if (!env.INTERNAL_API_SECRET) {
    logger.warn(
      'INTERNAL_API_SECRET is not set — the internal app→socket bridge will reject all requests (401). ' +
        'Workflow lifecycle events and execution log streaming from the main app will not reach clients.'
    )
  }

  const httpServer = createServer()
  const io = createSocketIOServer(httpServer)

  // Opt-in cross-instance broadcasting (no-op without REDIS_URL).
  const redisClients: RedisAdapterClients | null = await attachRedisAdapter(io)

  const roomManager = new RoomManager(io)

  io.use(authenticateSocket)

  const httpHandler = createHttpHandler(roomManager, logger, io)
  httpServer.on('request', (req, res) => {
    logger.info(`HTTP ${req.method} ${req.url}`, {
      host: req.headers.host,
      origin: req.headers.origin,
    })
    httpHandler(req, res)
  })

  io.engine.on('connection_error', (err) => {
    logger.error('Socket.IO connection error:', {
      req: err.req?.url,
      code: err.code,
      message: err.message,
      context: err.context,
    })
  })

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`New socket connection: ${socket.id}`)
    setupAllHandlers(socket, roomManager)
  })

  const reaper = setInterval(() => {
    try {
      roomManager.reapGhostPresence()
      pruneRoleCache()
    } catch (error) {
      logger.error('Presence reaper error:', error)
    }
  }, REAPER_INTERVAL_MS)
  // Don't let the reaper keep the process alive on its own.
  if (typeof reaper.unref === 'function') reaper.unref()

  const PORT = Number(env.PORT || env.SOCKET_PORT || 3002)
  const HOST = '0.0.0.0'

  logger.info('Starting Socket.IO server...', {
    port: PORT,
    host: HOST,
    nodeEnv: env.NODE_ENV,
    hasDatabase: !!env.DATABASE_URL,
    hasAuth: !!env.BETTER_AUTH_SECRET,
    crossInstance: !!redisClients,
  })

  httpServer.listen(PORT, HOST, () => {
    logger.info(`Socket.IO server running on ${HOST}:${PORT}`)
    logger.info(`🏥 Health check available at: http://${HOST}:${PORT}/health`)
  })

  httpServer.on('error', (error: NodeJS.ErrnoException) => {
    logger.error('❌ Server error:', error)
    // A port that can't be bound is fatal — exit so the orchestrator restarts us instead of
    // leaving a half-alive process that never accepts connections.
    if (error.code === 'EADDRINUSE' || error.code === 'EACCES') {
      process.exit(1)
    }
  })

  let shuttingDown = false
  const shutdown = async (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    logger.info(`Received ${signal}, shutting down Socket.IO server...`)

    clearInterval(reaper)

    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit')
      process.exit(1)
    }, SHUTDOWN_TIMEOUT_MS)
    if (typeof forceExit.unref === 'function') forceExit.unref()

    // Persist any coalesced subblock edits still sitting in their debounce window before we close
    // connections, so no in-flight keystroke is lost on restart.
    try {
      await flushAllPendingSubblocks(roomManager)
    } catch (error) {
      logger.error('Error flushing pending subblock updates during shutdown:', error)
    }

    // Tell THIS pod's clients the server is going away so they reconnect promptly. Scope to local
    // sockets (io.local) — a plain io.emit would fan out across the Redis adapter to every pod's
    // clients, turning one routine restart into a fleet-wide reconnect storm.
    try {
      io.local.emit('server-shutdown', {
        message: 'Realtime server is restarting',
        timestamp: Date.now(),
      })
    } catch {
      // ignore
    }

    io.close(async () => {
      try {
        if (redisClients) {
          await Promise.allSettled([redisClients.pubClient.quit(), redisClients.subClient.quit()])
        }
      } catch (error) {
        logger.error('Error tearing down Redis adapter clients:', error)
      }
      httpServer.close(() => {
        logger.info('Socket.IO server closed')
        clearTimeout(forceExit)
        process.exit(0)
      })
    })
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  // Don't exit in production, just log
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

main().catch((error) => {
  logger.error('❌ Socket server failed to start:', error)
  process.exit(1)
})
