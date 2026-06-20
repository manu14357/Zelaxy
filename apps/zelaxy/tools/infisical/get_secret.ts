import type { GetSecretParams, InfisicalObjectResponse } from '@/tools/infisical/types'
import type { ToolConfig } from '@/tools/types'

export const getSecretTool: ToolConfig<GetSecretParams, InfisicalObjectResponse> = {
  id: 'infisical_get_secret',
  name: 'Infisical Get Secret',
  description: 'Get a single secret by name from an Infisical project environment',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Infisical API token',
    },
    workspaceId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Infisical project (workspace) ID',
    },
    environment: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: "Environment slug (default 'dev')",
    },
    secretName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Name of the secret to retrieve',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(
        `https://app.infisical.com/api/v3/secrets/raw/${encodeURIComponent(params.secretName)}`
      )
      url.searchParams.append('workspaceId', params.workspaceId)
      url.searchParams.append('environment', params.environment || 'dev')
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const secret = data.secret || data
    return {
      success: true,
      output: { data: secret, metadata: { secretName: secret.secretKey || '' } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Infisical secret object' },
    metadata: {
      type: 'json',
      description: 'Secret identifiers',
      properties: {
        secretName: { type: 'string', description: 'Secret key name' },
      },
    },
  },
}
