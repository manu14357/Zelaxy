import type { DaytonaCreateWorkspaceParams, DaytonaObjectResponse } from '@/tools/daytona/types'
import type { ToolConfig } from '@/tools/types'

export const createWorkspaceTool: ToolConfig<DaytonaCreateWorkspaceParams, DaytonaObjectResponse> =
  {
    id: 'daytona_create_workspace',
    name: 'Daytona Create Workspace',
    description: 'Create a new Daytona workspace',
    version: '1.0.0',

    params: {
      apiKey: {
        type: 'string',
        required: true,
        visibility: 'user-only',
        description: 'Daytona API key',
      },
      name: {
        type: 'string',
        required: true,
        visibility: 'user-or-llm',
        description: 'Name for the workspace',
      },
      target: {
        type: 'string',
        required: false,
        visibility: 'user-or-llm',
        description: 'Region where the workspace will be created (e.g., us, eu)',
      },
    },

    request: {
      url: () => 'https://app.daytona.io/api/workspace',
      method: 'POST',
      headers: (params) => ({
        Authorization: `Bearer ${params.apiKey}`,
        'Content-Type': 'application/json',
      }),
      body: (params) => {
        const body: Record<string, any> = { name: params.name }
        if (params.target) body.target = params.target
        return body
      },
    },

    transformResponse: async (response) => {
      const data = await response.json()
      return {
        success: true,
        output: { data, metadata: { id: data.id } },
      }
    },

    outputs: {
      data: { type: 'json', description: 'The created Daytona workspace object' },
      metadata: {
        type: 'json',
        description: 'Workspace identifiers',
        properties: {
          id: { type: 'string', description: 'Workspace ID' },
        },
      },
    },
  }
