// BullMQ Worker Entrypoint — Railway deployment target
// Runs as a long-lived Node.js process: `bun run worker/index.ts`
//
// Architecture:
//   [Vercel / API / UI]
//           ↓
//      (add job via producer)
//           ↓
//        Redis
//           ↓
//    [Railway Worker]  ← this file
//           ↓
//     LLM / workflow processing

import { type Job, Worker } from 'bullmq'
import Redis from 'ioredis'
import { getWebhookConcurrency, getWorkflowConcurrency } from '@/lib/bullmq/concurrency'
import { WEBHOOK_QUEUE_NAME, WORKFLOW_QUEUE_NAME } from '@/lib/bullmq/queues'
import {
  JOB_NAMES,
  type WebhookExecutionPayload,
  type WorkflowExecutionPayload,
} from '@/lib/bullmq/types'
import { processWebhookExecution, processWorkflowExecution } from './processor'

// ─── Configuration ───────────────────────────────────────────────────────────

// Per-queue concurrency. With no per-type env vars set, both fall back to the
// legacy WORKER_CONCURRENCY (default 5) — i.e. unchanged behaviour.
const WORKFLOW_CONCURRENCY = getWorkflowConcurrency()
const WEBHOOK_CONCURRENCY = getWebhookConcurrency()
const MAX_STALLED_COUNT = 2
const STALL_INTERVAL = 30_000 // 30s
const LOCK_DURATION = 180_000 // 3 minutes — matches former Trigger.dev maxDuration

// ─── Logger (simple, no dependency on Next.js) ───────────────────────────────

function log(level: string, message: string, meta?: Record<string, any>) {
  const ts = new Date().toISOString()
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
  console.log(`[${ts}] [${level.toUpperCase()}] [BullMQ-Worker] ${message}${metaStr}`)
}

// ─── Redis Connection (dedicated for worker — BullMQ best practice) ──────────

function createWorkerConnection(): Redis {
  const url = process.env.REDIS_URL
  if (!url) {
    log('error', 'REDIS_URL is required for the BullMQ worker')
    process.exit(1)
  }

  return new Redis(url, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    keepAlive: 30_000,
    connectTimeout: 10_000,
    retryStrategy: (times) => {
      if (times > 10) {
        log('error', 'Redis connection failed after 10 attempts — exiting')
        process.exit(1)
      }
      return Math.min(times * 500, 5_000)
    },
  })
}

// ─── Job Router ──────────────────────────────────────────────────────────────

async function processJob(job: Job): Promise<any> {
  log('info', `Processing job ${job.id}`, { name: job.name, attempt: job.attemptsMade + 1 })

  switch (job.name) {
    case JOB_NAMES.WORKFLOW_EXECUTION:
      return processWorkflowExecution(job.data as WorkflowExecutionPayload)

    case JOB_NAMES.WEBHOOK_EXECUTION:
      return processWebhookExecution(job.data as WebhookExecutionPayload)

    default:
      throw new Error(`Unknown job name: ${job.name}`)
  }
}

// ─── Worker Setup ────────────────────────────────────────────────────────────

// Both Workers share one Redis connection (BullMQ allows this) and run the same
// job router. Each is bound to its own queue with its own concurrency, which is
// how per-job-type concurrency is achieved on BullMQ OSS.
const connection = createWorkerConnection()

function createQueueWorker(queueName: string, concurrency: number): Worker {
  return new Worker(queueName, processJob, {
    connection,
    concurrency,
    maxStalledCount: MAX_STALLED_COUNT,
    stalledInterval: STALL_INTERVAL,
    lockDuration: LOCK_DURATION,
    // Rate limiting (optional — uncomment to limit throughput)
    // limiter: { max: 10, duration: 1_000 },
  })
}

const workflowWorker = createQueueWorker(WORKFLOW_QUEUE_NAME, WORKFLOW_CONCURRENCY)
const webhookWorker = createQueueWorker(WEBHOOK_QUEUE_NAME, WEBHOOK_CONCURRENCY)

const workers: { worker: Worker; queueName: string; concurrency: number }[] = [
  { worker: workflowWorker, queueName: WORKFLOW_QUEUE_NAME, concurrency: WORKFLOW_CONCURRENCY },
  { worker: webhookWorker, queueName: WEBHOOK_QUEUE_NAME, concurrency: WEBHOOK_CONCURRENCY },
]

// ─── Worker Events ───────────────────────────────────────────────────────────

for (const { worker, queueName, concurrency } of workers) {
  worker.on('ready', () => {
    log('info', `Worker ready — listening on queue "${queueName}" with concurrency ${concurrency}`)
  })

  worker.on('active', (job) => {
    log('info', `Job ${job.id} active`, { name: job.name, queue: queueName })
  })

  worker.on('completed', (job, result) => {
    log('info', `Job ${job.id} completed`, {
      name: job.name,
      queue: queueName,
      success: result?.success,
      workflowId: result?.workflowId,
      duration:
        job.finishedOn && job.processedOn ? `${job.finishedOn - job.processedOn}ms` : undefined,
    })
  })

  worker.on('failed', (job, err) => {
    log('error', `Job ${job?.id} failed`, {
      name: job?.name,
      queue: queueName,
      error: err.message,
      attempt: job?.attemptsMade,
    })
  })

  worker.on('stalled', (jobId) => {
    log('warn', `Job ${jobId} stalled`, { queue: queueName })
  })

  worker.on('error', (err) => {
    log('error', 'Worker error', { queue: queueName, error: err.message })
  })
}

// ─── Graceful Shutdown ───────────────────────────────────────────────────────

let isShuttingDown = false

async function shutdown(signal: string) {
  if (isShuttingDown) return
  isShuttingDown = true

  log('info', `Received ${signal} — starting graceful shutdown...`)

  try {
    // Close workers first (each waits for its in-flight jobs to complete)
    await Promise.all(workers.map(({ worker }) => worker.close()))
    log('info', 'Workers closed — all in-flight jobs completed')

    // Close Redis connection
    await connection.quit()
    log('info', 'Redis connection closed')
  } catch (err: any) {
    log('error', 'Error during shutdown', { error: err.message })
  }

  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// ─── Keep Process Alive ──────────────────────────────────────────────────────

log('info', 'BullMQ worker starting...', {
  queues: {
    [WORKFLOW_QUEUE_NAME]: WORKFLOW_CONCURRENCY,
    [WEBHOOK_QUEUE_NAME]: WEBHOOK_CONCURRENCY,
  },
  lockDuration: `${LOCK_DURATION / 1000}s`,
  redisUrl: process.env.REDIS_URL?.replace(/\/\/.*@/, '//***@') || 'not set',
})

// Validate required environment variables for worker operation
const REQUIRED_WORKER_ENV_VARS = ['DATABASE_URL', 'ENCRYPTION_KEY']
const missing = REQUIRED_WORKER_ENV_VARS.filter((key) => !process.env[key])
if (missing.length > 0) {
  log('error', `Missing required environment variables: ${missing.join(', ')}`)
  process.exit(1)
}
