import type { OktaGetUserParams, OktaObjectResponse } from '@/tools/okta/types'
import type { ToolConfig } from '@/tools/types'

export const getUserTool: ToolConfig<OktaGetUserParams, OktaObjectResponse> = {
  id: 'okta_get_user',
  name: 'Okta Get User',
  description: 'Retrieve a single Okta user by ID or login',
  version: '1.0.0',

  params: {
    orgUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Okta org URL (e.g. https://your-org.okta.com)',
    },
    apiToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Okta API token',
    },
    userId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'User ID or login (email) to look up',
    },
  },

  request: {
    url: (params) => {
      const baseUrl = params.orgUrl.trim().replace(/\/$/, '')
      return `${baseUrl}/api/v1/users/${encodeURIComponent(params.userId.trim())}`
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `SSWS ${params.apiToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data,
        metadata: { id: data.id, status: data.status },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The requested Okta user object' },
    metadata: {
      type: 'json',
      description: 'User identifiers',
      properties: {
        id: { type: 'string', description: 'User ID' },
        status: { type: 'string', description: 'User status' },
      },
    },
  },
}
