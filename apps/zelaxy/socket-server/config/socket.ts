import type { Server as HttpServer } from 'http'
import { createAdapter } from '@socket.io/redis-adapter'
import { Redis } from 'ioredis'
import { Server } from 'socket.io'
import { env } from '@/lib/env'
import { isProd } from '@/lib/environment'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('SocketIOConfig')

/**
 * Get allowed origins for Socket.IO CORS configuration
 */
function getAllowedOrigins(): string[] {
  const allowedOrigins = [
    env.NEXT_PUBLIC_APP_URL,
    env.NEXT_PUBLIC_VERCEL_URL,
    'http://localhost:3000',
    ...(env.ALLOWED_ORIGINS?.split(',') || []),
  ].filter((url): url is string => Boolean(url))

  logger.info('Socket.IO CORS configuration:', { allowedOrigins })

  return allowedOrigins
}

/**
 * Create and configure a Socket.IO server instance
 * @param httpServer - The HTTP server instance to attach Socket.IO to
 * @returns Configured Socket.IO server instance
 */
export function createSocketIOServer(httpServer: HttpServer): Server {
  const allowedOrigins = getAllowedOrigins()

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'socket.io'],
      credentials: true, // Enable credentials to accept cookies
    },
    transports: ['websocket', 'polling'], // WebSocket first, polling as fallback
    allowEIO3: true, // Keep legacy support for compatibility
    pingTimeout: 60000, // Back to original conservative setting
    pingInterval: 25000, // Back to original interval
    maxHttpBufferSize: 1e6,
    cookie: {
      name: 'io',
      path: '/',
      httpOnly: true,
      sameSite: 'none', // Required for cross-origin cookies
      secure: isProd, // HTTPS in production
    },
  })

  logger.info('Socket.IO server configured with:', {
    allowedOrigins: allowedOrigins.length,
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
    cookieSecure: isProd,
    corsCredentials: true,
  })

  return io
}

/** Redis pub/sub clients backing the Socket.IO adapter (for graceful teardown). */
export interface RedisAdapterClients {
  pubClient: Redis
  subClient: Redis
}

/** Resolve once the client reaches 'ready'. Ignores 'error' (handled by the client's error listener)
 * so a transient connection error during boot doesn't reject the readiness wait. */
function waitForReady(client: Redis): Promise<void> {
  if (client.status === 'ready') return Promise.resolve()
  return new Promise<void>((resolve) => client.once('ready', () => resolve()))
}

/**
 * Attach the Redis adapter so `io.to(room).emit(...)` and the internal HTTP bridge fan out across
 * every socket-server instance — required to run more than one pod behind a load balancer.
 *
 * Opt-in: only wired when REDIS_URL is set. With no REDIS_URL the server keeps the default
 * in-memory adapter (single-instance behavior, unchanged).
 *
 * Robustness: the adapter is attached immediately and always delivers to LOCAL sockets first (so a
 * Redis outage never breaks same-pod collaboration), then publishes cross-pod. The clients reconnect
 * indefinitely with capped backoff, so a transient Redis blip at boot self-heals into cross-instance
 * mode instead of permanently dropping to single-pod. `enableOfflineQueue: false` means broadcasts
 * during an outage are dropped rather than buffered unbounded. Boot is never blocked on Redis: we
 * wait best-effort for the first connection, then continue regardless. Returns the clients for
 * graceful-shutdown teardown, or `null` when Redis is not configured / setup fails.
 */
export async function attachRedisAdapter(io: Server): Promise<RedisAdapterClients | null> {
  const redisUrl = env.REDIS_URL
  if (!redisUrl) {
    logger.info('REDIS_URL not set — using in-memory adapter (single-instance mode)')
    return null
  }

  try {
    const redisOptions = {
      maxRetriesPerRequest: null as null,
      // Reconnect forever with capped backoff so a transient outage self-heals.
      retryStrategy: (times: number) => Math.min(times * 200, 5000),
      // Drop broadcasts issued while disconnected instead of queueing them unbounded — a missed
      // fan-out during an outage is fine; a growing offline queue is not.
      enableOfflineQueue: false,
    }
    const pubClient = new Redis(redisUrl, redisOptions)
    const subClient = pubClient.duplicate()

    pubClient.on('error', (err) => logger.error('Redis adapter pub client error:', err))
    subClient.on('error', (err) => logger.error('Redis adapter sub client error:', err))

    // createAdapter() issues SUBSCRIBE/PSUBSCRIBE synchronously in its constructor. With
    // enableOfflineQueue:false those reject ("Stream isn't writeable") if the clients haven't
    // connected yet — an unhandled rejection at boot. So attach only once both clients are ready;
    // until then the default in-memory adapter handles local delivery, and cross-pod engages on
    // connect. If Redis never comes up, waitForReady stays pending and we degrade to single-instance.
    const attach = () => {
      io.adapter(createAdapter(pubClient, subClient))
      logger.info('Socket.IO Redis adapter connected — cross-instance broadcasting enabled')
    }

    // Best-effort wait for the first connection, but never block boot on Redis.
    const ready = Promise.all([waitForReady(pubClient), waitForReady(subClient)]).then(() => true)
    const connected = await Promise.race([
      ready,
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 10_000)),
    ])
    if (connected) {
      attach()
    } else {
      logger.warn(
        'Redis not ready within 10s — using in-memory adapter for now; cross-instance broadcasting will engage automatically once Redis connects'
      )
      // Attach as soon as the clients connect, so SUBSCRIBE never runs against a non-writable stream.
      void ready.then(attach)
    }

    return { pubClient, subClient }
  } catch (error) {
    // Never let adapter setup crash the server; degrade to single-instance mode.
    logger.error('Failed to attach Redis adapter, falling back to in-memory adapter:', error)
    return null
  }
}
