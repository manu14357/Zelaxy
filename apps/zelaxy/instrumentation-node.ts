/**
 * Zelaxy - Server-side Instrumentation
 *
 * Includes local cron polling for Gmail/Outlook when running in development.
 */

import { createLogger } from './lib/logs/console/logger.ts'

const logger = createLogger('ZelaxyInstrumentation')

async function initializeOpenTelemetry() {
  // All telemetry disabled - Zelaxy runs completely private
  return
}

async function initializeSentry() {
  // All error tracking disabled - Zelaxy runs completely private
  return
}

/**
 * Local development cron scheduler.
 * Production cron definitions can be kept as a plain text reference in vercel.txt.
 * Locally, we use setInterval to simulate the same behavior.
 */
function startLocalCronJobs() {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    logger.warn('CRON_SECRET not set — local cron polling disabled')
    return
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const headers = { Authorization: `Bearer ${cronSecret}` }

  const cronJobs = [
    { path: '/api/webhooks/poll/gmail', intervalMs: 60_000, name: 'Gmail poll' },
    { path: '/api/webhooks/poll/outlook', intervalMs: 60_000, name: 'Outlook poll' },
    { path: '/api/schedules/execute', intervalMs: 60_000, name: 'Schedule execute' },
  ]

  // Delay the first run to allow the server to fully start
  setTimeout(() => {
    const jobNames = cronJobs.map((j) => j.name).join(', ')
    logger.info(`[LocalCron] Starting cron jobs: ${jobNames} (every 60s)`)

    for (const job of cronJobs) {
      // Run immediately on startup
      fetch(`${baseUrl}${job.path}`, { headers }).catch(() => {})

      // Then repeat on interval
      setInterval(() => {
        fetch(`${baseUrl}${job.path}`, { headers }).catch((err) => {
          logger.error(`[LocalCron] ${job.name} failed:`, err)
        })
      }, job.intervalMs)
    }
  }, 10_000) // Wait 10 seconds for server to be ready
}

export async function register() {
  await initializeSentry()
  await initializeOpenTelemetry()

  // Start local cron jobs in development
  if (process.env.NODE_ENV === 'development') {
    startLocalCronJobs()
  }
}

// Empty function since telemetry is disabled
export const onRequestError = () => {}
