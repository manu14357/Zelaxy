import type { ListGroupsParams, MicrosoftAdListResponse } from '@/tools/microsoft_ad/types'
import type { ToolConfig } from '@/tools/types'

export const listGroupsTool: ToolConfig<ListGroupsParams, MicrosoftAdListResponse> = {
  id: 'microsoft_ad_list_groups',
  name: 'Microsoft Entra List Groups',
  description: 'List groups in Microsoft Entra ID (Azure AD)',
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
      description: 'Maximum number of groups to return (max 999)',
    },
    filter: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'OData filter expression (e.g., securityEnabled eq true)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://graph.microsoft.com/v1.0/groups')
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
    const groups = data.value || []
    return {
      success: true,
      output: { data: groups, metadata: { count: groups.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Entra group objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of groups returned' },
      },
    },
  },
}
