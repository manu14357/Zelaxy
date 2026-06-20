import type { TinybirdListDatasourcesParams, TinybirdResponse } from '@/tools/tinybird/types'
import type { ToolConfig } from '@/tools/types'

export const listDatasourcesTool: ToolConfig<TinybirdListDatasourcesParams, TinybirdResponse> = {
  id: 'tinybird_list_datasources',
  name: 'Tinybird List Data Sources',
  description: 'List all data sources in the Tinybird workspace',
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
    url: () => 'https://api.tinybird.co/v0/datasources',
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
        metadata: { count: (data.datasources || []).length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Tinybird response object ({ datasources })' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of data sources returned' },
      },
    },
  },
}
