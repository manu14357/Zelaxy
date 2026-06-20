import type { RipplingGetWorkerParams, RipplingObjectResponse } from '@/tools/rippling/types'
import type { ToolConfig } from '@/tools/types'

export const getWorkerTool: ToolConfig<RipplingGetWorkerParams, RipplingObjectResponse> = {
  id: 'rippling_get_worker',
  name: 'Rippling Get Worker',
  description: 'Get a specific Rippling worker by ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Rippling API key',
    },
    id: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Worker ID',
    },
    expand: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated fields to expand',
    },
  },

  request: {
    url: (params) => {
      const base = `https://rest.ripplingapis.com/workers/${encodeURIComponent(params.id.trim())}/`
      if (params.expand) return `${base}?expand=${encodeURIComponent(params.expand)}`
      return base
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      Accept: 'application/json',
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
    data: { type: 'json', description: 'The Rippling worker object' },
    metadata: {
      type: 'json',
      description: 'Worker identifiers',
      properties: {
        id: { type: 'string', description: 'Worker ID' },
      },
    },
  },
}
