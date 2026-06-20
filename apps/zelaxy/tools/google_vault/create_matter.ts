import type { GoogleVaultCreateMatterParams, GoogleVaultResponse } from '@/tools/google_vault/types'
import type { ToolConfig } from '@/tools/types'

export const createMatterTool: ToolConfig<GoogleVaultCreateMatterParams, GoogleVaultResponse> = {
  id: 'google_vault_create_matter',
  name: 'Vault Create Matter',
  description: 'Create a new matter in Google Vault',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'OAuth access token for the Google Vault API',
    },
    name: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Name for the new matter',
    },
    description: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optional description for the matter',
    },
  },

  request: {
    url: () => 'https://vault.googleapis.com/v1/matters',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({ name: params.name, description: params.description }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { nextPageToken: null } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The created matter object' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
