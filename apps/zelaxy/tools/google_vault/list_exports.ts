import type { GoogleVaultListExportsParams, GoogleVaultResponse } from '@/tools/google_vault/types'
import type { ToolConfig } from '@/tools/types'

export const listExportsTool: ToolConfig<GoogleVaultListExportsParams, GoogleVaultResponse> = {
  id: 'google_vault_list_exports',
  name: 'Vault List Exports',
  description: 'List exports for a matter in Google Vault',
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
      description: 'The matter ID to list exports for',
    },
    pageSize: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of exports to return per page',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(`https://vault.googleapis.com/v1/matters/${params.matterId}/exports`)
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
        data: data.exports ?? [],
        metadata: { nextPageToken: data.nextPageToken ?? null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of export objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        nextPageToken: { type: 'string', description: 'Token for the next page of results' },
      },
    },
  },
}
