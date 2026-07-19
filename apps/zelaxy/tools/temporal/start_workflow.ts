import type { TemporalStartWorkflowResponse } from '@/tools/temporal/types'
import {
  buildTemporalHeaders,
  buildTemporalUrl,
  encodePayloads,
  newRequestId,
  readTemporalResponse,
} from '@/tools/temporal/utils'
import type { ToolConfig } from '@/tools/types'

export const temporalStartWorkflowTool: ToolConfig = {
  id: 'temporal_start_workflow',
  name: 'Temporal Start Workflow',
  description: 'Start a new Temporal workflow execution on a task queue.',
  version: '1.0.0',

  params: {
    serverUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Temporal server base URL (e.g., https://your-namespace.tmprl.cloud)',
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
      description: 'Temporal API key (Bearer token) for Temporal Cloud',
    },
    workflowId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Business identifier for the workflow execution',
    },
    workflowType: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Registered workflow type / name to execute',
    },
    taskQueue: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Task queue the workflow should run on',
    },
    input: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Workflow arguments as JSON. An array is treated as positional args; any other value is a single arg.',
    },
    workflowExecutionTimeout: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Total execution timeout as a duration string (e.g., "3600s")',
    },
    workflowRunTimeout: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Single run timeout as a duration string (e.g., "600s")',
    },
  },

  request: {
    url: (params) =>
      buildTemporalUrl(
        params.serverUrl,
        `/namespaces/${encodeURIComponent(params.namespace)}/workflows/${encodeURIComponent(
          params.workflowId
        )}`
      ),
    method: 'POST',
    headers: (params) => buildTemporalHeaders(params),
    body: (params) => {
      const body: Record<string, any> = {
        workflowId: params.workflowId,
        workflowType: { name: params.workflowType },
        taskQueue: { name: params.taskQueue },
        requestId: newRequestId(),
      }
      const input = encodePayloads(params.input)
      if (input) body.input = input
      if (params.workflowExecutionTimeout)
        body.workflowExecutionTimeout = params.workflowExecutionTimeout
      if (params.workflowRunTimeout) body.workflowRunTimeout = params.workflowRunTimeout
      return body
    },
  },

  transformResponse: async (response, params): Promise<TemporalStartWorkflowResponse> => {
    const data = await readTemporalResponse(response)
    return {
      success: true,
      output: {
        runId: data?.runId ?? '',
        workflowId: params?.workflowId ?? '',
        started: true,
      },
    }
  },

  outputs: {
    runId: { type: 'string', description: 'Run ID of the started workflow execution' },
    workflowId: { type: 'string', description: 'Workflow ID of the started execution' },
    started: { type: 'boolean', description: 'Whether the workflow was started' },
  },
}
