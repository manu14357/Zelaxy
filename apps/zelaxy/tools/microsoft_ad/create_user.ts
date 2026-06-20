import type { CreateUserParams, MicrosoftAdObjectResponse } from '@/tools/microsoft_ad/types'
import type { ToolConfig } from '@/tools/types'

export const createUserTool: ToolConfig<CreateUserParams, MicrosoftAdObjectResponse> = {
  id: 'microsoft_ad_create_user',
  name: 'Microsoft Entra Create User',
  description: 'Create a new user in Microsoft Entra ID (Azure AD)',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Microsoft Graph API bearer access token',
    },
    displayName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Display name for the user',
    },
    mailNickname: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Mail alias for the user',
    },
    userPrincipalName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'User principal name (e.g., user@example.com)',
    },
    password: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Initial password for the user',
    },
    accountEnabled: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Whether the account is enabled (default true)',
    },
  },

  request: {
    url: () => 'https://graph.microsoft.com/v1.0/users',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      accountEnabled: params.accountEnabled ?? true,
      displayName: params.displayName,
      mailNickname: params.mailNickname,
      userPrincipalName: params.userPrincipalName,
      passwordProfile: {
        password: params.password,
        forceChangePasswordNextSignIn: true,
      },
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
    data: { type: 'json', description: 'The created Entra user object' },
    metadata: {
      type: 'json',
      description: 'User identifiers',
      properties: {
        id: { type: 'string', description: 'User ID' },
      },
    },
  },
}
