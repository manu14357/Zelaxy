import { Job } from 'bullmq'
import { getWebhookQueue, getWorkflowQueue } from './queues'
import {
  JOB_NAMES,
  type JobStatus,
  type WebhookExecutionPayload,
  type WorkflowExecutionPayload,
} from './types'

/**
 * Add a workflow execution job to the workflow queue.
 * Called from Vercel API routes (fire-and-forget).
 */
export async function addWorkflowJob(
  payload: WorkflowExecutionPayload
): Promise<{ jobId: string }> {
  const queue = getWorkflowQueue()
  const job = await queue.add(JOB_NAMES.WORKFLOW_EXECUTION, payload, {
    jobId: `wf-${payload.workflowId}-${Date.now()}`,
  })
  return { jobId: job.id! }
}

/**
 * Add a webhook execution job to the webhook queue.
 * Called from Vercel API routes (fire-and-forget).
 */
export async function addWebhookJob(payload: WebhookExecutionPayload): Promise<{ jobId: string }> {
  const queue = getWebhookQueue()
  const job = await queue.add(JOB_NAMES.WEBHOOK_EXECUTION, payload, {
    jobId: `wh-${payload.webhookId}-${Date.now()}`,
  })
  return { jobId: job.id! }
}

/**
 * Get job status by ID — used by the /api/jobs/[jobId] polling endpoint.
 * Maps BullMQ internal states to the existing API response format.
 *
 * Jobs now live in one of two queues (workflow / webhook). The `wh-` prefix
 * identifies webhook jobs; anything else is a workflow job. We still fall back
 * to the other queue so old jobs enqueued before the split are still found.
 */
export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  const primary = jobId.startsWith('wh-') ? getWebhookQueue() : getWorkflowQueue()
  const secondary = jobId.startsWith('wh-') ? getWorkflowQueue() : getWebhookQueue()

  const job = (await Job.fromId(primary, jobId)) ?? (await Job.fromId(secondary, jobId))

  if (!job) return null

  const state = await job.getState()

  const statusMap: Record<string, JobStatus['status']> = {
    waiting: 'queued',
    'waiting-children': 'queued',
    delayed: 'queued',
    active: 'processing',
    completed: 'completed',
    failed: 'failed',
    unknown: 'unknown',
  }

  const status: JobStatus = {
    status: statusMap[state] || 'unknown',
    progress: typeof job.progress === 'number' ? job.progress : undefined,
  }

  if (state === 'completed') {
    status.output = job.returnvalue
    status.completedAt = job.finishedOn ?? null
    status.duration = job.finishedOn && job.processedOn ? job.finishedOn - job.processedOn : null
  }

  if (state === 'failed') {
    status.error = {
      message: job.failedReason || 'Job failed',
      stackTrace: job.stacktrace?.[0],
    }
    status.completedAt = job.finishedOn ?? null
    status.duration = job.finishedOn && job.processedOn ? job.finishedOn - job.processedOn : null
  }

  if (state === 'active' || state === 'waiting' || state === 'delayed') {
    status.startedAt = job.processedOn ? new Date(job.processedOn) : null
  }

  return status
}
