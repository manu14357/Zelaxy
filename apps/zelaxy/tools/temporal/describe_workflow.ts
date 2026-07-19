import type { TemporalGenericResponse } from '@/tools/temporal/types'
import {
  buildTemporalHeaders,
  buildTemporalUrl,
  readTemporalResponse,
} from '@/tools/temporal/utils'
import type { ToolConfig } from '@/tools/types'

export const temporalDescribeWorkflowTool: ToolConfig = {
  id: 'temporal_describe_workflow',
  name: 'Temporal Describe Workflow',
  description: 'Fetch execution details and status for a Temporal workflow.',
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
      description: 'Workflow ID to describe',
    },
    runId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optional run ID to target a specific run',
    },
  },

  request: {
    url: (params) => {
      const base = buildTemporalUrl(
        params.serverUrl,
        `/namespaces/${encodeURIComponent(params.namespace)}/workflows/${encodeURIComponent(
          params.workflowId
        )}`
      )
      return params.runId ? `${base}?execution.runId=${encodeURIComponent(params.runId)}` : base
    },
    method: 'GET',
    headers: (params) => buildTemporalHeaders(params),
  },

  transformResponse: async (response): Promise<TemporalGenericResponse> => {
    const data = await readTemporalResponse(response)
    const info = data?.workflowExecutionInfo ?? {}
    return {
      success: true,
      output: {
        status: info?.status ?? null,
        execution: info?.execution ?? null,
        type: info?.type ?? null,
        startTime: info?.startTime ?? null,
        closeTime: info?.closeTime ?? null,
        taskQueue: info?.taskQueue ?? null,
        workflowExecutionInfo: info,
        pendingActivities: data?.pendingActivities ?? [],
      },
    }
  },

  outputs: {
    status: { type: 'string', description: 'Execution status (e.g., RUNNING, COMPLETED)' },
    execution: { type: 'json', description: 'Workflow execution identifiers' },
    type: { type: 'json', description: 'Workflow type info' },
    startTime: { type: 'string', description: 'Execution start time' },
    closeTime: { type: 'string', description: 'Execution close time, if closed' },
    taskQueue: { type: 'string', description: 'Task queue the workflow runs on' },
    workflowExecutionInfo: { type: 'json', description: 'Full execution info object' },
    pendingActivities: { type: 'json', description: 'Currently pending activities' },
  },
}
