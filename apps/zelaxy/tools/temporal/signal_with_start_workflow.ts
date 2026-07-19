import type { TemporalGenericResponse } from '@/tools/temporal/types'
import {
  buildTemporalHeaders,
  buildTemporalUrl,
  encodePayloads,
  newRequestId,
  readTemporalResponse,
} from '@/tools/temporal/utils'
import type { ToolConfig } from '@/tools/types'

export const temporalSignalWithStartWorkflowTool: ToolConfig = {
  id: 'temporal_signal_with_start_workflow',
  name: 'Temporal Signal With Start Workflow',
  description:
    'Signal a Temporal workflow, starting it first if it is not already running (signal-with-start).',
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
      description: 'Workflow ID',
    },
    workflowType: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Registered workflow type / name to start if not running',
    },
    taskQueue: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Task queue the workflow should run on',
    },
    signalName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Name of the signal to send',
    },
    signalInput: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Signal arguments as JSON (array for positional args)',
    },
    input: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Workflow start arguments as JSON (array for positional args)',
    },
  },

  request: {
    url: (params) =>
      buildTemporalUrl(
        params.serverUrl,
        `/namespaces/${encodeURIComponent(params.namespace)}/workflows/${encodeURIComponent(
          params.workflowId
        )}/signal-with-start/${encodeURIComponent(params.signalName)}`
      ),
    method: 'POST',
    headers: (params) => buildTemporalHeaders(params),
    body: (params) => {
      const body: Record<string, any> = {
        workflowId: params.workflowId,
        workflowType: { name: params.workflowType },
        taskQueue: { name: params.taskQueue },
        signalName: params.signalName,
        requestId: newRequestId(),
      }
      const signalInput = encodePayloads(params.signalInput)
      if (signalInput) body.signalInput = signalInput
      const input = encodePayloads(params.input)
      if (input) body.input = input
      return body
    },
  },

  transformResponse: async (response, params): Promise<TemporalGenericResponse> => {
    const data = await readTemporalResponse(response)
    return {
      success: true,
      output: {
        runId: data?.runId ?? '',
        workflowId: params?.workflowId ?? '',
        signaled: true,
      },
    }
  },

  outputs: {
    runId: { type: 'string', description: 'Run ID of the (possibly started) execution' },
    workflowId: { type: 'string', description: 'Workflow ID' },
    signaled: { type: 'boolean', description: 'Whether the signal was delivered' },
  },
}
