import type { CreateSecretParams, InfisicalObjectResponse } from '@/tools/infisical/types'
import type { ToolConfig } from '@/tools/types'

export const createSecretTool: ToolConfig<CreateSecretParams, InfisicalObjectResponse> = {
  id: 'infisical_create_secret',
  name: 'Infisical Create Secret',
  description: 'Create a new secret in an Infisical project environment',
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
      description: 'Name of the secret to create',
    },
    secretValue: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Value to store for the secret',
    },
  },

  request: {
    url: (params) =>
      `https://app.infisical.com/api/v3/secrets/raw/${encodeURIComponent(params.secretName)}`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      workspaceId: params.workspaceId,
      environment: params.environment || 'dev',
      secretValue: params.secretValue,
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
    data: { type: 'json', description: 'The created Infisical secret object' },
    metadata: {
      type: 'json',
      description: 'Secret identifiers',
      properties: {
        secretName: { type: 'string', description: 'Secret key name' },
      },
    },
  },
}
