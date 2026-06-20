import type { DaytonaListResponse, DaytonaListWorkspacesParams } from '@/tools/daytona/types'
import type { ToolConfig } from '@/tools/types'

export const listWorkspacesTool: ToolConfig<DaytonaListWorkspacesParams, DaytonaListResponse> = {
  id: 'daytona_list_workspaces',
  name: 'Daytona List Workspaces',
  description: 'List Daytona workspaces in the organization',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Daytona API key',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of workspaces to return',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://app.daytona.io/api/workspace')
      if (params.limit) url.searchParams.append('limit', String(params.limit))
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
    const workspaces = Array.isArray(data) ? data : data.items || []
    return {
      success: true,
      output: { data: workspaces, metadata: { count: workspaces.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Daytona workspace objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of workspaces returned' },
      },
    },
  },
}
