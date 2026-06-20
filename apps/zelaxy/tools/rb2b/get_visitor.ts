import type { Rb2bGetVisitorParams, Rb2bObjectResponse } from '@/tools/rb2b/types'
import type { ToolConfig } from '@/tools/types'

export const getVisitorTool: ToolConfig<Rb2bGetVisitorParams, Rb2bObjectResponse> = {
  id: 'rb2b_get_visitor',
  name: 'RB2B Get Visitor',
  description: 'Retrieve a single identified visitor by ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'RB2B API key',
    },
    id: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The visitor ID to retrieve',
    },
  },

  request: {
    url: (params) => `https://api.rb2b.com/visitors/${encodeURIComponent(params.id)}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const visitor = data.visitor ?? data.data ?? data
    return {
      success: true,
      output: {
        data: visitor,
        metadata: { id: visitor?.id },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The identified visitor object' },
    metadata: {
      type: 'json',
      description: 'Visitor identifiers',
      properties: {
        id: { type: 'string', description: 'Visitor ID' },
      },
    },
  },
}
