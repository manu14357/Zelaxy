import type { DatagmaObjectResponse, EnrichPersonParams } from '@/tools/datagma/types'
import type { ToolConfig } from '@/tools/types'

export const enrichPersonTool: ToolConfig<EnrichPersonParams, DatagmaObjectResponse> = {
  id: 'datagma_enrich_person',
  name: 'Datagma Enrich Person',
  description: 'Enrich a person profile from their name and company',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Datagma API key',
    },
    firstName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: "Person's first name",
    },
    lastName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: "Person's last name",
    },
    company: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Company name or keyword',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://gateway.datagma.net/api/ingress/full')
      url.searchParams.set('apiId', params.apiKey)
      if (params.firstName) url.searchParams.set('firstName', params.firstName)
      if (params.lastName) url.searchParams.set('lastName', params.lastName)
      if (params.company) url.searchParams.set('company', params.company)
      return url.toString()
    },
    method: 'GET',
    headers: () => ({ Accept: 'application/json' }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data,
        metadata: { found: Boolean(data?.name || data?.email || data?.firstName) },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The enriched person profile from Datagma' },
    metadata: {
      type: 'json',
      description: 'Response metadata',
      properties: {
        found: { type: 'boolean', description: 'Whether a person record was matched' },
      },
    },
  },
}
