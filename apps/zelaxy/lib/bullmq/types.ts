// Payload types for BullMQ jobs — extracted from former Trigger.dev task definitions

export interface WorkflowExecutionPayload {
  workflowId: string
  userId: string
  input?: any
  triggerType?: 'api' | 'webhook' | 'schedule' | 'manual' | 'chat'
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

// Job names used in the llm-jobs queue
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
