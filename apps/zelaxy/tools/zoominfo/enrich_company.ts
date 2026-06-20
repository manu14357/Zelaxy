import type { ToolConfig } from '@/tools/types'
import type { EnrichCompanyParams, ZoomInfoObjectResponse } from '@/tools/zoominfo/types'

export const enrichCompanyTool: ToolConfig<EnrichCompanyParams, ZoomInfoObjectResponse> = {
  id: 'zoominfo_enrich_company',
  name: 'ZoomInfo Enrich Company',
  description: 'Enrich companies with firmographics, industry, financials, and more',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'ZoomInfo Bearer token',
    },
    matchCompanyInput: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description:
        'Array of company match criteria, e.g. [{"companyName":"Acme","companyWebsite":"acme.com"}]',
    },
    outputFields: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Array of fields to return (e.g. ["name","website","revenue"])',
    },
  },

  request: {
    url: () => 'https://api.zoominfo.com/enrich/company',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = { matchCompanyInput: params.matchCompanyInput }
      if (params.outputFields) body.outputFields = params.outputFields
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const results = data?.data?.result ?? data?.data ?? []
    return {
      success: true,
      output: {
        data,
        metadata: { count: Array.isArray(results) ? results.length : 0 },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The enrichment result object from ZoomInfo' },
    metadata: {
      type: 'json',
      description: 'Response metadata',
      properties: {
        count: { type: 'number', description: 'Number of enriched company results' },
      },
    },
  },
}
