import type { ExtendGetRunParams, ExtendObjectResponse } from '@/tools/extend/types'
import type { ToolConfig } from '@/tools/types'

export const getRunTool: ToolConfig<ExtendGetRunParams, ExtendObjectResponse> = {
  id: 'extend_get_run',
  name: 'Extend Get Run',
  description: 'Retrieve the status and result of an Extend processor run by its ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Extend API key',
    },
    runId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the processor or parse run to retrieve',
    },
  },

  request: {
    url: (params) =>
      `https://api.extend.ai/processor_runs/${encodeURIComponent(params.runId.trim())}`,
    method: 'GET',
    headers: (params) => ({
      Accept: 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
      'x-extend-api-version': '2025-04-21',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const run = data.processorRun ?? data
    return {
      success: true,
      output: {
        data: run,
        metadata: { id: run.id ?? null, status: run.status ?? null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Extend processor run object' },
    metadata: {
      type: 'json',
      description: 'Run identifiers',
      properties: {
        id: { type: 'string', description: 'Run ID' },
        status: { type: 'string', description: 'Run status' },
      },
    },
  },
}
