import type { DomainSearchParams, IcypeasObjectResponse } from '@/tools/icypeas/types'
import type { ToolConfig } from '@/tools/types'

export const domainSearchTool: ToolConfig<DomainSearchParams, IcypeasObjectResponse> = {
  id: 'icypeas_domain_search',
  name: 'Icypeas Domain Search',
  description: 'Find email addresses associated with a company domain',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Icypeas API key',
    },
    domain: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Company domain to search (e.g. stripe.com)',
    },
  },

  request: {
    url: () => 'https://app.icypeas.com/api/domain-search',
    method: 'POST',
    headers: (params) => ({
      Authorization: params.apiKey,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({ domain: params.domain }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data,
        metadata: { searchId: data.item?._id ?? null, status: data.item?.status ?? null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The domain-search submission response' },
    metadata: {
      type: 'json',
      description: 'Search identifiers',
      properties: {
        searchId: { type: 'string', description: 'Icypeas internal search ID' },
        status: { type: 'string', description: 'Search status' },
      },
    },
  },
}
