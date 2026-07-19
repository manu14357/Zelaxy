import type { ToolResponse } from '@/tools/types'

/**
 * A single Temporal Payload as represented over the HTTP API. `metadata` values
 * and `data` are base64-encoded strings in the JSON-over-HTTP representation of
 * the underlying protobuf message.
 */
export interface TemporalPayload {
  metadata?: Record<string, string>
  data?: string
}

export interface TemporalPayloads {
  payloads?: TemporalPayload[]
}

/**
 * Connection parameters shared by every Temporal tool. These target the
 * Temporal server's REST HTTP API directly (`{serverUrl}/api/v1/...`), not the
 * official Temporal client SDK and not a proxy.
 */
export interface TemporalConnectionParams {
  serverUrl: string
  namespace: string
  apiKey?: string
}

export interface TemporalWorkflowExecution {
  workflowId?: string
  runId?: string
}

export interface TemporalStartWorkflowResponse extends ToolResponse {
  output: {
    runId: string
    workflowId: string
    started: boolean
  }
}

export interface TemporalGenericResponse extends ToolResponse {
  output: Record<string, unknown>
}
