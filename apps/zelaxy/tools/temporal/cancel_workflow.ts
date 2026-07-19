import type { TemporalGenericResponse } from '@/tools/temporal/types'
import {
  buildTemporalHeaders,
  buildTemporalUrl,
  readTemporalResponse,
} from '@/tools/temporal/utils'
import type { ToolConfig } from '@/tools/types'

export const temporalCancelWorkflowTool: ToolConfig = {
  id: 'temporal_cancel_workflow',
  name: 'Temporal Cancel Workflow',
  description: 'Request cancellation of a running Temporal workflow execution.',
  version: '1.0.0',

  params: {
    serverUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Temporal server base URL',
    },
    namespace: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Temporal namespace',
    },
    apiKey: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Temporal API key (Bearer token)',
    },
    workflowId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Workflow ID to cancel',
    },
    runId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optional run ID to target a specific run',
    },
    reason: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Human-readable reason for cancellation',
    },
  },

  request: {
    url: (params) =>
      buildTemporalUrl(
        params.serverUrl,
        `/namespaces/${encodeURIComponent(params.namespace)}/workflows/${encodeURIComponent(
          params.workflowId
        )}/cancel`
      ),
    method: 'POST',
    headers: (params) => buildTemporalHeaders(params),
    body: (params) => {
      const body: Record<string, any> = {
        workflowExecution: {
          workflowId: params.workflowId,
          ...(params.runId ? { runId: params.runId } : {}),
        },
      }
      if (params.reason) body.reason = params.reason
      return body
    },
  },

  transformResponse: async (response, params): Promise<TemporalGenericResponse> => {
    await readTemporalResponse(response)
    return {
      success: true,
      output: {
        cancelRequested: true,
        workflowId: params?.workflowId ?? '',
      },
    }
  },

  outputs: {
    cancelRequested: { type: 'boolean', description: 'Whether cancellation was requested' },
    workflowId: { type: 'string', description: 'Workflow ID that was cancelled' },
  },
}
