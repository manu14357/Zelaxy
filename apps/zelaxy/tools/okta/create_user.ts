import type { OktaCreateUserParams, OktaObjectResponse } from '@/tools/okta/types'
import type { ToolConfig } from '@/tools/types'

export const createUserTool: ToolConfig<OktaCreateUserParams, OktaObjectResponse> = {
  id: 'okta_create_user',
  name: 'Okta Create User',
  description: 'Create and activate a new user in your Okta organization',
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
    firstName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'First name of the user',
    },
    lastName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Last name of the user',
    },
    email: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Email address of the user',
    },
    login: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Login for the user (defaults to email if not provided)',
    },
  },

  request: {
    url: (params) => {
      const baseUrl = params.orgUrl.trim().replace(/\/$/, '')
      return `${baseUrl}/api/v1/users?activate=true`
    },
    method: 'POST',
    headers: (params) => ({
      Authorization: `SSWS ${params.apiToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      profile: {
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email,
        login: params.login || params.email,
      },
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
    data: { type: 'json', description: 'The created Okta user object' },
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
