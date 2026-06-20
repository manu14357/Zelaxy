import type { DaytonaGetWorkspaceParams, DaytonaObjectResponse } from '@/tools/daytona/types'
import type { ToolConfig } from '@/tools/types'

export const getWorkspaceTool: ToolConfig<DaytonaGetWorkspaceParams, DaytonaObjectResponse> = {
  id: 'daytona_get_workspace',
  name: 'Daytona Get Workspace',
  description: 'Get details of a Daytona workspace',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Daytona API key',
    },
    workspaceId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the workspace',
    },
  },

  request: {
    url: (params) =>
      `https://app.daytona.io/api/workspace/${encodeURIComponent(params.workspaceId)}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Daytona workspace object' },
    metadata: {
      type: 'json',
      description: 'Workspace identifiers',
      properties: {
        id: { type: 'string', description: 'Workspace ID' },
      },
    },
  },
}
