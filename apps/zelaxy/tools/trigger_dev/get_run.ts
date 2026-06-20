import type { TriggerDevGetRunParams, TriggerDevObjectResponse } from '@/tools/trigger_dev/types'
import type { ToolConfig } from '@/tools/types'

export const getRunTool: ToolConfig<TriggerDevGetRunParams, TriggerDevObjectResponse> = {
  id: 'trigger_dev_get_run',
  name: 'Trigger.dev Get Run',
  description: 'Retrieve a Trigger.dev run by its ID, including status and output',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Trigger.dev secret API key',
    },
    runId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the run to retrieve',
    },
  },

  request: {
    url: (params) => `https://api.trigger.dev/api/v3/runs/${encodeURIComponent(params.runId)}`,
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
    data: { type: 'json', description: 'The Trigger.dev run object' },
    metadata: {
      type: 'json',
      description: 'Run identifiers',
      properties: {
        id: { type: 'string', description: 'Run ID' },
      },
    },
  },
}
