import type { TemporalGenericResponse } from '@/tools/temporal/types'
import {
  buildTemporalHeaders,
  buildTemporalUrl,
  readTemporalResponse,
} from '@/tools/temporal/utils'
import type { ToolConfig } from '@/tools/types'

export const temporalListSchedulesTool: ToolConfig = {
  id: 'temporal_list_schedules',
  name: 'Temporal List Schedules',
  description: 'List the schedules in a Temporal namespace.',
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
    pageSize: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of schedules to return',
    },
    nextPageToken: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination token from a previous response',
    },
    query: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optional List Filter query to filter schedules',
    },
  },

  request: {
    url: (params) => {
      const base = buildTemporalUrl(
        params.serverUrl,
        `/namespaces/${encodeURIComponent(params.namespace)}/schedules`
      )
      const search = new URLSearchParams()
      if (params.pageSize) search.set('maximumPageSize', String(params.pageSize))
      if (params.nextPageToken) search.set('nextPageToken', params.nextPageToken)
      if (params.query) search.set('query', params.query)
      const qs = search.toString()
      return qs ? `${base}?${qs}` : base
    },
    method: 'GET',
    headers: (params) => buildTemporalHeaders(params),
  },

  transformResponse: async (response): Promise<TemporalGenericResponse> => {
    const data = await readTemporalResponse(response)
    const schedules = data?.schedules ?? []
    return {
      success: true,
      output: {
        schedules,
        count: schedules.length,
        nextPageToken: data?.nextPageToken ?? null,
      },
    }
  },

  outputs: {
    schedules: { type: 'json', description: 'Array of schedule list entries' },
    count: { type: 'number', description: 'Number of schedules returned in this page' },
    nextPageToken: { type: 'string', description: 'Token for fetching the next page' },
  },
}
