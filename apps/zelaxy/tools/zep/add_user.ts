import type { ToolConfig } from '@/tools/types'
import type { ZepResponse } from '@/tools/zep/types'

// Add (create) a Zep user
export const zepAddUserTool: ToolConfig<any, ZepResponse> = {
  id: 'zep_add_user',
  name: 'Zep Add User',
  description: 'Create a user in Zep to associate threads and memory with',
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
      description: 'Unique identifier for the user',
    },
    email: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: "The user's email address",
    },
    firstName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: "The user's first name",
    },
    lastName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: "The user's last name",
    },
    metadata: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Arbitrary JSON metadata to attach to the user',
    },
  },

  request: {
    url: 'https://api.getzep.com/api/v2/users',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Api-Key ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = { user_id: params.userId }
      if (params.email) body.email = params.email
      if (params.firstName) body.first_name = params.firstName
      if (params.lastName) body.last_name = params.lastName
      if (params.metadata !== undefined && params.metadata !== '') {
        body.metadata =
          typeof params.metadata === 'string' ? JSON.parse(params.metadata) : params.metadata
      }
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json().catch(() => ({}))
    return {
      success: true,
      output: {
        success: true,
        user: data,
      },
    }
  },

  outputs: {
    success: { type: 'boolean', description: 'Whether the user was created' },
    user: { type: 'json', description: 'The created user object' },
  },
}
