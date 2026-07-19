import { Queue } from 'bullmq'
import { getBullMQConnection } from './connection'
import { QUEUE_NAMES } from './types'

// One queue per job type so each can be served by a Worker with its own
// concurrency (BullMQ OSS has no per-job-name concurrency).
//
// - WORKFLOW_QUEUE_NAME keeps the historical 'llm-jobs' name so any jobs already
//   enqueued before the split still drain on deploy.
// - WEBHOOK_QUEUE_NAME is the new dedicated webhook queue.
const WORKFLOW_QUEUE_NAME = QUEUE_NAMES.WORKFLOW
const WEBHOOK_QUEUE_NAME = QUEUE_NAMES.WEBHOOK

const defaultJobOptions = {
  attempts: 1, // Matches former Trigger.dev maxAttempts: 1
  backoff: { type: 'exponential' as const, delay: 3_000 },
  removeOnComplete: { age: 86_400 }, // Keep completed jobs for 24h (for status polling)
  removeOnFail: { age: 604_800 }, // Keep failed jobs for 7 days (for debugging)
}

let workflowQueue: Queue | null = null
let webhookQueue: Queue | null = null

/** Queue carrying workflow-execution jobs (historically the only queue). */
export function getWorkflowQueue(): Queue {
  if (workflowQueue) return workflowQueue

  workflowQueue = new Queue(WORKFLOW_QUEUE_NAME, {
    connection: getBullMQConnection(),
    defaultJobOptions,
  })

  return workflowQueue
}

/** Queue carrying webhook-execution jobs. */
export function getWebhookQueue(): Queue {
  if (webhookQueue) return webhookQueue

  webhookQueue = new Queue(WEBHOOK_QUEUE_NAME, {
    connection: getBullMQConnection(),
    defaultJobOptions,
  })

  return webhookQueue
}

/**
 * @deprecated Back-compat alias — use getWorkflowQueue().
 * Returns the workflow queue (formerly the shared 'llm-jobs' queue).
 */
export function getLLMQueue(): Queue {
  return getWorkflowQueue()
}

// QUEUE_NAME retained for back-compat with existing imports (the workflow queue).
export { WORKFLOW_QUEUE_NAME, WORKFLOW_QUEUE_NAME as QUEUE_NAME, WEBHOOK_QUEUE_NAME }
