import type { ToolConfig } from '@/tools/types'
import type { WizaCreateListParams, WizaObjectResponse } from '@/tools/wiza/types'

export const createListTool: ToolConfig<WizaCreateListParams, WizaObjectResponse> = {
  id: 'wiza_create_list',
  name: 'Wiza Create List',
  description: 'Create a Wiza prospect list with search filters',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Wiza API key',
    },
    name: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Name of the list to create',
    },
    max_profiles: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of profiles to add to the list',
    },
    filters: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Prospect search filters to populate the list',
    },
  },

  request: {
    url: () => 'https://wiza.co/api/lists',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const list: Record<string, any> = { name: params.name }
      if (params.max_profiles !== undefined) list.max_profiles = params.max_profiles
      const body: Record<string, any> = { list }
      if (params.filters) body.filters = params.filters
      return body
    },
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
    data: { type: 'json', description: 'The created Wiza list object' },
    metadata: {
      type: 'json',
      description: 'List identifiers',
      properties: {
        id: { type: 'string', description: 'List ID' },
      },
    },
  },
}
