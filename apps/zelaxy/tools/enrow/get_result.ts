import type { EnrowObjectResponse, GetResultParams } from '@/tools/enrow/types'
import type { ToolConfig } from '@/tools/types'

export const getResultTool: ToolConfig<GetResultParams, EnrowObjectResponse> = {
  id: 'enrow_get_result',
  name: 'Enrow Get Result',
  description: 'Retrieve the result of an Enrow find-email job by ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Enrow API key',
    },
    id: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Job ID returned by the find-email operation',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.enrow.io/email/find/single/result')
      url.searchParams.append('id', params.id)
      return url.toString()
    },
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
      output: { data, metadata: { id: data.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The completed find-email result' },
    metadata: {
      type: 'json',
      description: 'Job identifiers',
      properties: {
        id: { type: 'string', description: 'The polled job ID' },
      },
    },
  },
}
