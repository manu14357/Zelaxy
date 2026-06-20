import type { ListUsersParams, MicrosoftAdListResponse } from '@/tools/microsoft_ad/types'
import type { ToolConfig } from '@/tools/types'

export const listUsersTool: ToolConfig<ListUsersParams, MicrosoftAdListResponse> = {
  id: 'microsoft_ad_list_users',
  name: 'Microsoft Entra List Users',
  description: 'List users in Microsoft Entra ID (Azure AD)',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Microsoft Graph API bearer access token',
    },
    top: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of users to return (max 999)',
    },
    filter: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: "OData filter expression (e.g., department eq 'Sales')",
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://graph.microsoft.com/v1.0/users')
      if (params.top) url.searchParams.append('$top', String(params.top))
      if (params.filter) url.searchParams.append('$filter', params.filter)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const users = data.value || []
    return {
      success: true,
      output: { data: users, metadata: { count: users.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Entra user objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of users returned' },
      },
    },
  },
}
