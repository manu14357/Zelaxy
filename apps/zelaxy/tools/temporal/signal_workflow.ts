import type { TemporalGenericResponse } from '@/tools/temporal/types'
import {
  buildTemporalHeaders,
  buildTemporalUrl,
  encodePayloads,
  readTemporalResponse,
} from '@/tools/temporal/utils'
import type { ToolConfig } from '@/tools/types'

export const temporalSignalWorkflowTool: ToolConfig = {
  id: 'temporal_signal_workflow',
  name: 'Temporal Signal Workflow',
  description: 'Send a signal to a running Temporal workflow execution.',
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
      description: 'Workflow ID to signal',
    },
    runId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optional run ID to target a specific run',
    },
    signalName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Name of the signal to send',
    },
    input: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Signal arguments as JSON (array for positional args)',
    },
  },

  request: {
    url: (params) =>
      buildTemporalUrl(
        params.serverUrl,
        `/namespaces/${encodeURIComponent(params.namespace)}/workflows/${encodeURIComponent(
          params.workflowId
        )}/signal/${encodeURIComponent(params.signalName)}`
      ),
    method: 'POST',
    headers: (params) => buildTemporalHeaders(params),
    body: (params) => {
      const body: Record<string, any> = {
        workflowExecution: {
          workflowId: params.workflowId,
          ...(params.runId ? { runId: params.runId } : {}),
        },
        signalName: params.signalName,
      }
      const input = encodePayloads(params.input)
      if (input) body.input = input
      return body
    },
  },

  transformResponse: async (response, params): Promise<TemporalGenericResponse> => {
    await readTemporalResponse(response)
    return {
      success: true,
      output: {
        signaled: true,
        workflowId: params?.workflowId ?? '',
        signalName: params?.signalName ?? '',
      },
    }
  },

  outputs: {
    signaled: { type: 'boolean', description: 'Whether the signal was delivered' },
    workflowId: { type: 'string', description: 'Workflow ID that was signaled' },
    signalName: { type: 'string', description: 'Name of the delivered signal' },
  },
}
