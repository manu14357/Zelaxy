import type { TemporalGenericResponse } from '@/tools/temporal/types'
import {
  buildTemporalHeaders,
  buildTemporalUrl,
  readTemporalResponse,
} from '@/tools/temporal/utils'
import type { ToolConfig } from '@/tools/types'

export const temporalResetWorkflowTool: ToolConfig = {
  id: 'temporal_reset_workflow',
  name: 'Temporal Reset Workflow',
  description: 'Reset a Temporal workflow execution to an earlier point in its history.',
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
      description: 'Workflow ID to reset',
    },
    runId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optional run ID to target a specific run',
    },
    workflowTaskFinishEventId: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'History event ID of the workflow task finish to reset to',
    },
    reason: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Human-readable reason for the reset',
    },
  },

  request: {
    url: (params) =>
      buildTemporalUrl(
        params.serverUrl,
        `/namespaces/${encodeURIComponent(params.namespace)}/workflows/${encodeURIComponent(
          params.workflowId
        )}/reset`
      ),
    method: 'POST',
    headers: (params) => buildTemporalHeaders(params),
    body: (params) => ({
      workflowExecution: {
        workflowId: params.workflowId,
        ...(params.runId ? { runId: params.runId } : {}),
      },
      workflowTaskFinishEventId: Number(params.workflowTaskFinishEventId),
      ...(params.reason ? { reason: params.reason } : {}),
    }),
  },

  transformResponse: async (response, params): Promise<TemporalGenericResponse> => {
    const data = await readTemporalResponse(response)
    return {
      success: true,
      output: {
        reset: true,
        runId: data?.runId ?? '',
        workflowId: params?.workflowId ?? '',
      },
    }
  },

  outputs: {
    reset: { type: 'boolean', description: 'Whether the workflow was reset' },
    runId: { type: 'string', description: 'Run ID of the new run created by the reset' },
    workflowId: { type: 'string', description: 'Workflow ID that was reset' },
  },
}
