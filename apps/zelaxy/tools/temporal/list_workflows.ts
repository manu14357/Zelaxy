import type { TemporalGenericResponse } from '@/tools/temporal/types'
import {
  buildTemporalHeaders,
  buildTemporalUrl,
  readTemporalResponse,
} from '@/tools/temporal/utils'
import type { ToolConfig } from '@/tools/types'

export const temporalListWorkflowsTool: ToolConfig = {
  id: 'temporal_list_workflows',
  name: 'Temporal List Workflows',
  description: 'List Temporal workflow executions using a List Filter (SQL-like) query.',
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
    query: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description:
        'List Filter query (e.g., WorkflowType = "MyWorkflow" AND ExecutionStatus = "Running")',
    },
    pageSize: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of executions to return',
    },
    nextPageToken: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination token from a previous response',
    },
  },

  request: {
    url: (params) => {
      const base = buildTemporalUrl(
        params.serverUrl,
        `/namespaces/${encodeURIComponent(params.namespace)}/workflows`
      )
      const search = new URLSearchParams()
      if (params.query) search.set('query', params.query)
      if (params.pageSize) search.set('pageSize', String(params.pageSize))
      if (params.nextPageToken) search.set('nextPageToken', params.nextPageToken)
      const qs = search.toString()
      return qs ? `${base}?${qs}` : base
    },
    method: 'GET',
    headers: (params) => buildTemporalHeaders(params),
  },

  transformResponse: async (response): Promise<TemporalGenericResponse> => {
    const data = await readTemporalResponse(response)
    const executions = data?.executions ?? []
    return {
      success: true,
      output: {
        executions,
        count: executions.length,
        nextPageToken: data?.nextPageToken ?? null,
      },
    }
  },

  outputs: {
    executions: { type: 'json', description: 'Array of matching workflow executions' },
    count: { type: 'number', description: 'Number of executions returned in this page' },
    nextPageToken: { type: 'string', description: 'Token for fetching the next page' },
  },
}
