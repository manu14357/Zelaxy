import type { LangSmithListResponse, ListRunsParams } from '@/tools/langsmith/types'
import type { ToolConfig } from '@/tools/types'

export const listRunsTool: ToolConfig<ListRunsParams, LangSmithListResponse> = {
  id: 'langsmith_list_runs',
  name: 'LangSmith List Runs',
  description: 'List runs in a LangSmith session (project)',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'LangSmith API key',
    },
    session: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Session (project) ID to list runs from',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of runs to return',
    },
  },

  request: {
    url: () => 'https://api.smith.langchain.com/runs/query',
    method: 'POST',
    headers: (params) => ({
      'x-api-key': params.apiKey,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = { session: [params.session] }
      if (params.limit) body.limit = params.limit
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const list = data?.runs || []
    return {
      success: true,
      output: { data: list, metadata: { count: list.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of run objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of runs returned' },
      },
    },
  },
}
