import type { BlockOutput } from '@/blocks/types'
import type { BlockLog, ExecutionResult } from '@/executor/types'

/**
 * Mutable state shared between the {@link Executor} facade and the driver modules.
 *
 * The facade owns this object; the engine, block runner and edge manager read from it. Fields that
 * can change after construction (the completion callbacks, the cancellation flag) live here so a
 * later `cancel()` or `setOnBlockComplete()` is observed by the running driver without rewiring.
 */
export interface DriverRuntime {
  initialBlockStates: Record<string, BlockOutput>
  environmentVariables: Record<string, string>
  workflowInput: any
  workflowVariables: Record<string, any>
  contextExtensions: any
  isChildExecution: boolean
  isDebugging: boolean
  cancelled: boolean
  /** Server-side cross-instance cancellation probe; undefined for browser-side manual runs. */
  checkCancelled?: () => Promise<boolean>
  onBlockComplete?: (blockLog: BlockLog) => void | Promise<void>
  onExecutionStart?: (workflowId: string, executionId?: string) => void | Promise<void>
  onExecutionComplete?: (result: ExecutionResult) => void | Promise<void>
}

/**
 * No-op stand-in for workflow telemetry. Tracking and analytics are removed from this fork; the
 * call sites are kept so the execution flow reads identically to an instrumented engine.
 */
export function trackWorkflowTelemetry(_eventName: string, _data: Record<string, any>): void {}

/**
 * Extracts a meaningful message from any error shape (nested response data, bare objects, strings).
 */
export function extractErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error
  }
  if (error.message) {
    return error.message
  }
  if (error.response?.data) {
    const data = error.response.data
    if (typeof data === 'string') {
      return data
    }
    if (data.message) {
      return data.message
    }
    return JSON.stringify(data)
  }
  if (typeof error === 'object') {
    return JSON.stringify(error)
  }
  return String(error)
}

/**
 * Produces a log-safe representation of an error that never renders as "undefined".
 */
export function sanitizeError(error: any): any {
  if (typeof error === 'string') {
    return error
  }
  if (error.message) {
    return error.message
  }
  if (error.response?.data) {
    const data = error.response.data
    if (typeof data === 'string') {
      return data
    }
    if (data.message) {
      return data.message
    }
    return JSON.stringify(data)
  }
  if (typeof error === 'object') {
    return JSON.stringify(error)
  }
  return String(error)
}
