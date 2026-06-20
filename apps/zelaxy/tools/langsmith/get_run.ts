import type { GetRunParams, LangSmithObjectResponse } from '@/tools/langsmith/types'
import type { ToolConfig } from '@/tools/types'

export const getRunTool: ToolConfig<GetRunParams, LangSmithObjectResponse> = {
  id: 'langsmith_get_run',
  name: 'LangSmith Get Run',
  description: 'Get a single LangSmith run by its ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'LangSmith API key',
    },
    runId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the run to retrieve',
    },
  },

  request: {
    url: (params) => `https://api.smith.langchain.com/runs/${params.runId.trim()}`,
    method: 'GET',
    headers: (params) => ({
      'x-api-key': params.apiKey,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data?.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The run object' },
    metadata: {
      type: 'json',
      description: 'Run identifiers',
      properties: {
        id: { type: 'string', description: 'Run ID' },
      },
    },
  },
}
