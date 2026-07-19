import type { TemporalGenericResponse } from '@/tools/temporal/types'
import {
  buildTemporalHeaders,
  buildTemporalUrl,
  readTemporalResponse,
} from '@/tools/temporal/utils'
import type { ToolConfig } from '@/tools/types'

export const temporalGetWorkflowHistoryTool: ToolConfig = {
  id: 'temporal_get_workflow_history',
  name: 'Temporal Get Workflow History',
  description: 'Retrieve the event history for a Temporal workflow execution.',
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
      description: 'Workflow ID whose history to fetch',
    },
    runId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optional run ID to target a specific run',
    },
    pageSize: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of history events per page',
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
        `/namespaces/${encodeURIComponent(params.namespace)}/workflows/${encodeURIComponent(
          params.workflowId
        )}/history`
      )
      const search = new URLSearchParams()
      if (params.runId) search.set('execution.runId', params.runId)
      if (params.pageSize) search.set('maximumPageSize', String(params.pageSize))
      if (params.nextPageToken) search.set('nextPageToken', params.nextPageToken)
      const qs = search.toString()
      return qs ? `${base}?${qs}` : base
    },
    method: 'GET',
    headers: (params) => buildTemporalHeaders(params),
  },

  transformResponse: async (response): Promise<TemporalGenericResponse> => {
    const data = await readTemporalResponse(response)
    const events = data?.history?.events ?? []
    return {
      success: true,
      output: {
        events,
        count: events.length,
        nextPageToken: data?.nextPageToken ?? null,
        archived: data?.archived ?? false,
      },
    }
  },

  outputs: {
    events: { type: 'json', description: 'Array of workflow history events' },
    count: { type: 'number', description: 'Number of events returned in this page' },
    nextPageToken: { type: 'string', description: 'Token for fetching the next page' },
    archived: { type: 'boolean', description: 'Whether the history was served from archival' },
  },
}
