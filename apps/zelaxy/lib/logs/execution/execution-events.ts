import { createLogger } from '@/lib/logs/console/logger'
import type { BlockLog } from '@/executor/types'

const logger = createLogger('ExecutionEvents')

/**
 * Get the Socket.IO server URL for HTTP bridge calls.
 * Falls back to localhost:3002 in development.
 */
function getSocketServerUrl(): string {
  // In BullMQ background workers, process.env is available
  return (
    process.env.SOCKET_SERVER_URL || process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002'
  )
}

export interface ExecutionStartedEvent {
  workflowId: string
  executionId: string
  triggerType: string
  startedAt: string
  workspaceId?: string
}

export interface ExecutionBlockCompleteEvent {
  workflowId: string
  executionId: string
  blockLog: BlockLog
  traceSpan?: any
  workspaceId?: string
}

export interface ExecutionCompleteEvent {
  workflowId: string
  executionId: string
  success: boolean
  endedAt: string
  error?: string
  workspaceId?: string
}

/**
 * Emits an execution event to the Socket.IO server via HTTP bridge.
 * This works from both the main Next.js app and BullMQ background workers.
 * Failures are silently logged — never blocks workflow execution.
 */
async function emitToSocketServer(endpoint: string, payload: Record<string, any>): Promise<void> {
  try {
    const socketUrl = getSocketServerUrl()
    const response = await fetch(`${socketUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      logger.warn(`Socket server ${endpoint} returned ${response.status}`)
    }
  } catch (error) {
    // Socket server may be unavailable — never block execution for this
    logger.debug(`Failed to emit to socket server ${endpoint}:`, error)
  }
}

/**
 * Notify that a workflow execution has started.
 * Creates an in-progress entry on the logs page.
 */
export async function emitExecutionStarted(event: ExecutionStartedEvent): Promise<void> {
  await emitToSocketServer('/api/execution-started', event)
}

/**
 * Notify that a single block has completed execution.
 * Updates the in-progress log entry with a new block result.
 */
export async function emitExecutionBlockComplete(
  event: ExecutionBlockCompleteEvent
): Promise<void> {
  await emitToSocketServer('/api/execution-block-complete', event)
}

/**
 * Notify that the entire workflow execution has completed.
 * Finalizes the in-progress log entry.
 */
export async function emitExecutionComplete(event: ExecutionCompleteEvent): Promise<void> {
  await emitToSocketServer('/api/execution-complete', event)
}
