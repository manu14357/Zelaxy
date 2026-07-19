// Payload types for BullMQ jobs — extracted from former Trigger.dev task definitions

export interface WorkflowExecutionPayload {
  workflowId: string
  userId: string
  input?: any
  triggerType?: 'api' | 'webhook' | 'schedule' | 'manual' | 'chat' | 'a2a'
  metadata?: Record<string, any>
}

export interface WebhookExecutionPayload {
  webhookId: string
  workflowId: string
  userId: string
  provider: string
  body: any
  headers: Record<string, string>
  path: string
  blockId?: string
}

export interface WorkflowExecutionResult {
  success: boolean
  workflowId: string
  executionId: string
  output: any
  executedAt: string
  metadata?: Record<string, any>
}

export interface WebhookExecutionResult {
  success: boolean
  workflowId: string
  executionId: string
  output: any
  executedAt: string
  provider: string
}

export type JobPayload = WorkflowExecutionPayload | WebhookExecutionPayload
export type JobResult = WorkflowExecutionResult | WebhookExecutionResult

// BullMQ queue names. Each job type has its own queue so each can be served by
// a Worker with its own concurrency (BullMQ OSS has no per-job-name concurrency).
// WORKFLOW keeps the historical 'llm-jobs' name so in-flight jobs drain on deploy.
export const QUEUE_NAMES = {
  WORKFLOW: 'llm-jobs',
  WEBHOOK: 'webhook-jobs',
} as const

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]

// Job name executed on each queue.
export const JOB_NAMES = {
  WORKFLOW_EXECUTION: 'workflow-execution',
  WEBHOOK_EXECUTION: 'webhook-execution',
} as const

export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES]

// Job status mapped to the API response format
export interface JobStatus {
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'unknown'
  output?: any
  error?: { message: string; stackTrace?: string }
  startedAt?: Date | null
  completedAt?: number | null
  duration?: number | null
  progress?: number
}
