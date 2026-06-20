import type { HubspotListResponse, ListContactsParams } from '@/tools/hubspot/types'
import type { ToolConfig } from '@/tools/types'

export const listContactsTool: ToolConfig<ListContactsParams, HubspotListResponse> = {
  id: 'hubspot_list_contacts',
  name: 'HubSpot List Contacts',
  description: 'List contacts from HubSpot CRM with pagination support',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'HubSpot private app access token',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of results per page (max 100, default 10)',
    },
    after: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination cursor for the next page of results',
    },
    properties: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Comma-separated list of property names to return (e.g. "email,firstname,lastname,phone")',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.hubapi.com/crm/v3/objects/contacts')
      if (params.limit) url.searchParams.append('limit', String(params.limit))
      if (params.after) url.searchParams.append('after', params.after)
      if (params.properties) url.searchParams.append('properties', params.properties)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const results = data.results || []
    return {
      success: true,
      output: {
        data: results,
        metadata: { count: results.length, after: data.paging?.next?.after ?? null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of HubSpot contact objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
        after: { type: 'string', description: 'Pagination cursor for the next page, if any' },
      },
    },
  },
}
