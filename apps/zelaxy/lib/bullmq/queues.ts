import { Queue } from 'bullmq'
import { getBullMQConnection } from './connection'

// Single queue for all background job types.
// Job name (workflow-execution / webhook-execution) differentiates processing.
const QUEUE_NAME = 'llm-jobs'

let queue: Queue | null = null

export function getLLMQueue(): Queue {
  if (queue) return queue

  queue = new Queue(QUEUE_NAME, {
    connection: getBullMQConnection(),
    defaultJobOptions: {
      attempts: 1, // Matches former Trigger.dev maxAttempts: 1
      backoff: { type: 'exponential', delay: 3_000 },
      removeOnComplete: { age: 86_400 }, // Keep completed jobs for 24h (for status polling)
      removeOnFail: { age: 604_800 }, // Keep failed jobs for 7 days (for debugging)
    },
  })

  return queue
}

export { QUEUE_NAME }
