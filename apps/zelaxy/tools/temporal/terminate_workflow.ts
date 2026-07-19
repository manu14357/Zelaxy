import type { TemporalGenericResponse } from '@/tools/temporal/types'
import {
  buildTemporalHeaders,
  buildTemporalUrl,
  encodePayloads,
  readTemporalResponse,
} from '@/tools/temporal/utils'
import type { ToolConfig } from '@/tools/types'

export const temporalTerminateWorkflowTool: ToolConfig = {
  id: 'temporal_terminate_workflow',
  name: 'Temporal Terminate Workflow',
  description: 'Forcefully terminate a running Temporal workflow execution.',
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
      description: 'Workflow ID to terminate',
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
      description: 'Human-readable reason for termination',
    },
    details: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optional details payload as JSON',
    },
  },

  request: {
    url: (params) =>
      buildTemporalUrl(
        params.serverUrl,
        `/namespaces/${encodeURIComponent(params.namespace)}/workflows/${encodeURIComponent(
          params.workflowId
        )}/terminate`
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
      const details = encodePayloads(params.details)
      if (details) body.details = details
      return body
    },
  },

  transformResponse: async (response, params): Promise<TemporalGenericResponse> => {
    await readTemporalResponse(response)
    return {
      success: true,
      output: {
        terminated: true,
        workflowId: params?.workflowId ?? '',
      },
    }
  },

  outputs: {
    terminated: { type: 'boolean', description: 'Whether the workflow was terminated' },
    workflowId: { type: 'string', description: 'Workflow ID that was terminated' },
  },
}
