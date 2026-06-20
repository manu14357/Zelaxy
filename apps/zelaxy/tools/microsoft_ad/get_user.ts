import type { GetUserParams, MicrosoftAdObjectResponse } from '@/tools/microsoft_ad/types'
import type { ToolConfig } from '@/tools/types'

export const getUserTool: ToolConfig<GetUserParams, MicrosoftAdObjectResponse> = {
  id: 'microsoft_ad_get_user',
  name: 'Microsoft Entra Get User',
  description: 'Get a user by ID or user principal name from Microsoft Entra ID',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Microsoft Graph API bearer access token',
    },
    userId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'User ID or user principal name (e.g., user@example.com)',
    },
  },

  request: {
    url: (params) => `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(params.userId)}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
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
    data: { type: 'json', description: 'The Entra user object' },
    metadata: {
      type: 'json',
      description: 'User identifiers',
      properties: {
        id: { type: 'string', description: 'User ID' },
      },
    },
  },
}
