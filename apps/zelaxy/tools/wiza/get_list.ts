import type { ToolConfig } from '@/tools/types'
import type { WizaGetListParams, WizaObjectResponse } from '@/tools/wiza/types'

export const getListTool: ToolConfig<WizaGetListParams, WizaObjectResponse> = {
  id: 'wiza_get_list',
  name: 'Wiza Get List',
  description: 'Retrieve a Wiza list by ID, including its status and stats',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Wiza API key',
    },
    id: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The list ID to retrieve',
    },
  },

  request: {
    url: (params) => `https://wiza.co/api/lists/${encodeURIComponent(params.id)}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const list = data.data ?? data
    return {
      success: true,
      output: { data: list, metadata: { id: list?.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The retrieved Wiza list object' },
    metadata: {
      type: 'json',
      description: 'List identifiers',
      properties: {
        id: { type: 'string', description: 'List ID' },
      },
    },
  },
}
