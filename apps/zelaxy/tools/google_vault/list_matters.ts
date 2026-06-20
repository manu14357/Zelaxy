import type { GoogleVaultListMattersParams, GoogleVaultResponse } from '@/tools/google_vault/types'
import type { ToolConfig } from '@/tools/types'

export const listMattersTool: ToolConfig<GoogleVaultListMattersParams, GoogleVaultResponse> = {
  id: 'google_vault_list_matters',
  name: 'Vault List Matters',
  description: 'List matters in Google Vault',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'OAuth access token for the Google Vault API',
    },
    pageSize: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of matters to return per page',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://vault.googleapis.com/v1/matters')
      if (params.pageSize) url.searchParams.set('pageSize', String(params.pageSize))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({ Authorization: `Bearer ${params.accessToken}` }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data: data.matters ?? [],
        metadata: { nextPageToken: data.nextPageToken ?? null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of matter objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        nextPageToken: { type: 'string', description: 'Token for the next page of results' },
      },
    },
  },
}
