import type {
  CompanyEnrichParams,
  PeopleDataLabsObjectResponse,
} from '@/tools/peopledatalabs/types'
import type { ToolConfig } from '@/tools/types'

export const companyEnrichTool: ToolConfig<CompanyEnrichParams, PeopleDataLabsObjectResponse> = {
  id: 'peopledatalabs_company_enrich',
  name: 'People Data Labs Company Enrich',
  description: 'Enrich a single company by name, website, or ticker',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'People Data Labs API key',
    },
    name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Company name',
    },
    website: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Company website domain',
    },
    ticker: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Stock ticker symbol',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.peopledatalabs.com/v5/company/enrich')
      if (params.name) url.searchParams.append('name', params.name)
      if (params.website) url.searchParams.append('website', params.website)
      if (params.ticker) url.searchParams.append('ticker', params.ticker)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      'X-Api-Key': params.apiKey,
      Accept: 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data: data.data || data || {},
        metadata: { status: data.status ?? response.status, likelihood: data.likelihood },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The matched company record' },
    metadata: {
      type: 'json',
      description: 'Match metadata',
      properties: {
        status: { type: 'number', description: 'API status code' },
        likelihood: { type: 'number', description: 'Match likelihood score (1-10)' },
      },
    },
  },
}
