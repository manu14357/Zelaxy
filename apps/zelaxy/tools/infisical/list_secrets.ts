import type { InfisicalListResponse, ListSecretsParams } from '@/tools/infisical/types'
import type { ToolConfig } from '@/tools/types'

export const listSecretsTool: ToolConfig<ListSecretsParams, InfisicalListResponse> = {
  id: 'infisical_list_secrets',
  name: 'Infisical List Secrets',
  description: 'List the secrets in an Infisical project environment',
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
  },

  request: {
    url: (params) => {
      const url = new URL('https://app.infisical.com/api/v3/secrets/raw')
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
    const secrets = data.secrets || []
    return {
      success: true,
      output: { data: secrets, metadata: { count: secrets.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Infisical secret objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of secrets returned' },
      },
    },
  },
}
