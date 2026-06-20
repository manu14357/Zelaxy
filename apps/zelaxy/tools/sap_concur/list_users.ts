import type { ListUsersParams, SapConcurListResponse } from '@/tools/sap_concur/types'
import type { ToolConfig } from '@/tools/types'

export const listUsersTool: ToolConfig<ListUsersParams, SapConcurListResponse> = {
  id: 'sap_concur_list_users',
  name: 'SAP Concur List Users',
  description: 'List users from SAP Concur (GET /api/v3.0/common/users).',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'SAP Concur OAuth bearer access token',
    },
    primaryEmail: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter users by primary email address',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of records to return (default 25, max 100)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://www.concursolutions.com/api/v3.0/common/users')
      if (params.primaryEmail) url.searchParams.append('primaryEmail', params.primaryEmail)
      if (params.limit) url.searchParams.append('limit', String(params.limit))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      Accept: 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const items = data?.Items ?? []
    return {
      success: true,
      output: {
        data: Array.isArray(items) ? items : [],
        metadata: { count: Array.isArray(items) ? items.length : 0, status: response.status },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of user objects (Items)' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of users returned' },
        status: { type: 'number', description: 'HTTP status code returned by Concur' },
      },
    },
  },
}
