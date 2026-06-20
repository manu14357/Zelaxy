import type { TriggerDevListResponse, TriggerDevListRunsParams } from '@/tools/trigger_dev/types'
import type { ToolConfig } from '@/tools/types'

export const listRunsTool: ToolConfig<TriggerDevListRunsParams, TriggerDevListResponse> = {
  id: 'trigger_dev_list_runs',
  name: 'Trigger.dev List Runs',
  description: 'List Trigger.dev runs in the environment of the API key',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Trigger.dev secret API key',
    },
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Run status to filter by (e.g. COMPLETED, FAILED, EXECUTING)',
    },
    taskIdentifier: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Task identifier to filter by',
    },
    pageSize: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of runs per page (max 100, default 25)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.trigger.dev/api/v3/runs')
      if (params.status) url.searchParams.append('filter[status]', params.status)
      if (params.taskIdentifier)
        url.searchParams.append('filter[taskIdentifier]', params.taskIdentifier)
      if (params.pageSize) url.searchParams.append('page[size]', String(params.pageSize))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const runs = data.data || []
    return {
      success: true,
      output: { data: runs, metadata: { count: runs.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Trigger.dev run objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of runs returned' },
      },
    },
  },
}
