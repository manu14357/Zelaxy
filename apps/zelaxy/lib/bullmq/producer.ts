import { Job } from 'bullmq'
import { getLLMQueue } from './queues'
import {
  JOB_NAMES,
  type JobStatus,
  type WebhookExecutionPayload,
  type WorkflowExecutionPayload,
} from './types'

/**
 * Add a workflow execution job to the queue.
 * Called from Vercel API routes (fire-and-forget).
 */
export async function addWorkflowJob(
  payload: WorkflowExecutionPayload
): Promise<{ jobId: string }> {
  const queue = getLLMQueue()
  const job = await queue.add(JOB_NAMES.WORKFLOW_EXECUTION, payload, {
    jobId: `wf-${payload.workflowId}-${Date.now()}`,
  })
  return { jobId: job.id! }
}

/**
 * Add a webhook execution job to the queue.
 * Called from Vercel API routes (fire-and-forget).
 */
export async function addWebhookJob(payload: WebhookExecutionPayload): Promise<{ jobId: string }> {
  const queue = getLLMQueue()
  const job = await queue.add(JOB_NAMES.WEBHOOK_EXECUTION, payload, {
    jobId: `wh-${payload.webhookId}-${Date.now()}`,
  })
  return { jobId: job.id! }
}

/**
 * Get job status by ID — used by the /api/jobs/[jobId] polling endpoint.
 * Maps BullMQ internal states to the existing API response format.
 */
export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  const queue = getLLMQueue()
  const job = await Job.fromId(queue, jobId)

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
