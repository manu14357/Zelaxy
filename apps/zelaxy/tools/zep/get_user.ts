import type { ToolConfig } from '@/tools/types'
import type { ZepResponse } from '@/tools/zep/types'

// Get a Zep user
export const zepGetUserTool: ToolConfig<any, ZepResponse> = {
  id: 'zep_get_user',
  name: 'Zep Get User',
  description: 'Retrieve a user record from Zep by user ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your Zep API key',
    },
    userId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Identifier of the user to retrieve',
    },
  },

  request: {
    url: (params) => `https://api.getzep.com/api/v2/users/${encodeURIComponent(params.userId)}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Api-Key ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json().catch(() => ({}))
    return {
      success: true,
      output: {
        user: data,
      },
    }
  },

  outputs: {
    user: { type: 'json', description: 'The user object' },
  },
}
