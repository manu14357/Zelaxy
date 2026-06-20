import type { GetAccountParams, NeverBounceAccountResponse } from '@/tools/neverbounce/types'
import type { ToolConfig } from '@/tools/types'

export const getAccountTool: ToolConfig<GetAccountParams, NeverBounceAccountResponse> = {
  id: 'neverbounce_get_account',
  name: 'NeverBounce Get Account',
  description: 'Retrieve account info and remaining verification credits from NeverBounce',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'NeverBounce API key',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.neverbounce.com/v4/account/info')
      url.searchParams.append('key', params.apiKey)
      return url.toString()
    },
    method: 'GET',
    headers: () => ({ Accept: 'application/json' }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { status: data.status } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The NeverBounce account info object' },
    metadata: {
      type: 'json',
      description: 'Account response metadata',
      properties: {
        status: { type: 'string', description: 'Response status' },
      },
    },
  },
}
