import type { TemporalGenericResponse } from '@/tools/temporal/types'
import {
  buildTemporalHeaders,
  buildTemporalUrl,
  readTemporalResponse,
} from '@/tools/temporal/utils'
import type { ToolConfig } from '@/tools/types'

export const temporalCountWorkflowsTool: ToolConfig = {
  id: 'temporal_count_workflows',
  name: 'Temporal Count Workflows',
  description: 'Count Temporal workflow executions matching a List Filter query.',
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
      description: 'List Filter query (e.g., ExecutionStatus = "Running")',
    },
  },

  request: {
    url: (params) => {
      const base = buildTemporalUrl(
        params.serverUrl,
        `/namespaces/${encodeURIComponent(params.namespace)}/workflow-count`
      )
      return params.query ? `${base}?query=${encodeURIComponent(params.query)}` : base
    },
    method: 'GET',
    headers: (params) => buildTemporalHeaders(params),
  },

  transformResponse: async (response): Promise<TemporalGenericResponse> => {
    const data = await readTemporalResponse(response)
    return {
      success: true,
      output: {
        count: Number(data?.count ?? 0),
        groups: data?.groups ?? [],
      },
    }
  },

  outputs: {
    count: { type: 'number', description: 'Total number of matching executions' },
    groups: { type: 'json', description: 'Per-group counts when grouping is used' },
  },
}
