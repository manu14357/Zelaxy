import type { HubspotListResponse, SearchContactsParams } from '@/tools/hubspot/types'
import type { ToolConfig } from '@/tools/types'

export const searchContactsTool: ToolConfig<SearchContactsParams, HubspotListResponse> = {
  id: 'hubspot_search_contacts',
  name: 'HubSpot Search Contacts',
  description: 'Search for contacts in HubSpot CRM using a query or filter groups',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'HubSpot private app access token',
    },
    query: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Search query string to match against contact text fields',
    },
    filterGroups: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Array of filter groups as JSON. Each group has a "filters" array of {propertyName, operator, value}',
    },
    properties: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Array of property names to return (e.g. ["email","firstname","lastname"])',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of results to return (max 100)',
    },
  },

  request: {
    url: () => 'https://api.hubapi.com/crm/v3/objects/contacts/search',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = {}
      if (params.query) body.query = params.query
      if (params.filterGroups) {
        let filterGroups = params.filterGroups
        if (typeof filterGroups === 'string') filterGroups = JSON.parse(filterGroups)
        body.filterGroups = filterGroups
      }
      if (params.properties) {
        let properties = params.properties
        if (typeof properties === 'string') properties = JSON.parse(properties)
        body.properties = properties
      }
      if (params.limit) body.limit = params.limit
      return body
    },
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
    data: { type: 'json', description: 'Array of matching HubSpot contact objects' },
    metadata: {
      type: 'json',
      description: 'Search result metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
        after: { type: 'string', description: 'Pagination cursor for the next page, if any' },
      },
    },
  },
}
