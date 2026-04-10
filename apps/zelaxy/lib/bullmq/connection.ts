import Redis from 'ioredis'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('BullMQ')

// Shared Redis connection for BullMQ queue + worker.
// Uses REDIS_URL env var (required for BullMQ, unlike the optional cache client).
// ioredis is already a project dependency.

let connection: Redis | null = null

export function getRedisUrl(): string {
  const url = process.env.REDIS_URL
  if (!url) {
    throw new Error(
      'REDIS_URL environment variable is required for BullMQ job queue. ' +
        'Set it to a Redis connection string (e.g. redis://localhost:6379).'
    )
  }
  return url
}

/**
 * Returns a shared ioredis connection for BullMQ.
 * BullMQ recommends reusing one connection for the queue (producer side)
 * and creating dedicated connections internally for the Worker.
 */
export function getBullMQConnection(): Redis {
  if (connection) return connection

  const url = getRedisUrl()

  connection = new Redis(url, {
    maxRetriesPerRequest: null, // Required by BullMQ — it manages retries internally
    enableReadyCheck: false, // Faster startup
    keepAlive: 30_000,
    connectTimeout: 10_000,
    retryStrategy: (times) => {
      if (times > 10) {
        logger.error('BullMQ Redis connection failed after 10 attempts')
        return null // Stop retrying
      }
      return Math.min(times * 500, 5_000)
    },
  })

  connection.on('error', (err) => {
    logger.error('BullMQ Redis connection error', { error: err.message })
  })

  connection.on('connect', () => {
    logger.info('BullMQ Redis connected')
  })

  return connection
}

/**
 * Gracefully close the shared connection (called during shutdown).
 */
export async function closeBullMQConnection(): Promise<void> {
  if (connection) {
    await connection.quit()
    connection = null
    logger.info('BullMQ Redis connection closed')
  }
}
