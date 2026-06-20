import type { FirefliesGetUserParams, FirefliesObjectResponse } from '@/tools/fireflies/types'
import type { ToolConfig } from '@/tools/types'

export const getUserTool: ToolConfig<FirefliesGetUserParams, FirefliesObjectResponse> = {
  id: 'fireflies_get_user',
  name: 'Fireflies Get User',
  description: 'Get user information from Fireflies.ai. Returns current user if no ID specified.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Fireflies API key',
    },
    userId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'User ID to retrieve (defaults to API key owner)',
    },
  },

  request: {
    url: () => 'https://api.fireflies.ai/graphql',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      query: `query User($id: String) {
        user(id: $id) {
          user_id
          name
          email
          is_admin
          num_transcripts
          minutes_consumed
        }
      }`,
      variables: params.userId ? { id: params.userId } : {},
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const user = data.data?.user || {}
    return {
      success: true,
      output: { data: user, metadata: { id: user.user_id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Fireflies user object' },
    metadata: {
      type: 'json',
      description: 'User identifiers',
      properties: {
        id: { type: 'string', description: 'User ID' },
      },
    },
  },
}
