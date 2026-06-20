import type { TinybirdListPipesParams, TinybirdResponse } from '@/tools/tinybird/types'
import type { ToolConfig } from '@/tools/types'

export const listPipesTool: ToolConfig<TinybirdListPipesParams, TinybirdResponse> = {
  id: 'tinybird_list_pipes',
  name: 'Tinybird List Pipes',
  description: 'List all pipes in the Tinybird workspace',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Tinybird API token',
    },
  },

  request: {
    url: () => 'https://api.tinybird.co/v0/pipes',
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data,
        metadata: { count: (data.pipes || []).length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Tinybird response object ({ pipes })' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of pipes returned' },
      },
    },
  },
}
