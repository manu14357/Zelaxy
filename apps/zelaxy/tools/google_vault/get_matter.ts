import type { GoogleVaultGetMatterParams, GoogleVaultResponse } from '@/tools/google_vault/types'
import type { ToolConfig } from '@/tools/types'

export const getMatterTool: ToolConfig<GoogleVaultGetMatterParams, GoogleVaultResponse> = {
  id: 'google_vault_get_matter',
  name: 'Vault Get Matter',
  description: 'Get a specific matter from Google Vault',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'OAuth access token for the Google Vault API',
    },
    matterId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The matter ID to fetch',
    },
  },

  request: {
    url: (params) => `https://vault.googleapis.com/v1/matters/${params.matterId}`,
    method: 'GET',
    headers: (params) => ({ Authorization: `Bearer ${params.accessToken}` }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { nextPageToken: null } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The matter object' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
