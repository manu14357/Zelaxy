import type { ToolConfig } from '@/tools/types'
import type { EnrichContactParams, ZoomInfoObjectResponse } from '@/tools/zoominfo/types'

export const enrichContactTool: ToolConfig<EnrichContactParams, ZoomInfoObjectResponse> = {
  id: 'zoominfo_enrich_contact',
  name: 'ZoomInfo Enrich Contact',
  description: 'Enrich contacts with verified emails, phone numbers, and job details',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'ZoomInfo Bearer token',
    },
    matchPersonInput: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description:
        'Array of contact match criteria, e.g. [{"firstName":"Jane","lastName":"Doe","companyName":"Acme"}]',
    },
    outputFields: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Array of fields to return (e.g. ["email","phone","jobTitle"])',
    },
  },

  request: {
    url: () => 'https://api.zoominfo.com/enrich/contact',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = { matchPersonInput: params.matchPersonInput }
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
        count: { type: 'number', description: 'Number of enriched contact results' },
      },
    },
  },
}
