import type { ToolConfig } from '@/tools/types'
import type { ZendeskListResponse, ZendeskSearchParams } from '@/tools/zendesk/types'

export const searchTool: ToolConfig<ZendeskSearchParams, ZendeskListResponse> = {
  id: 'zendesk_search',
  name: 'Zendesk Search',
  description: 'Search across tickets, users, and organizations in Zendesk',
  version: '1.0.0',

  params: {
    subdomain: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your Zendesk subdomain (e.g. "acme" for acme.zendesk.com)',
    },
    email: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your Zendesk account email address',
    },
    apiToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Zendesk API token',
    },
    query: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Search query using Zendesk search syntax (e.g. "type:ticket status:open")',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(`https://${params.subdomain}.zendesk.com/api/v2/search.json`)
      url.searchParams.append('query', params.query)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`${params.email}/token:${params.apiToken}`).toString('base64')}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data: data.results || [],
        metadata: { count: data.count ?? (data.results || []).length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of matching Zendesk objects' },
    metadata: {
      type: 'json',
      description: 'Search metadata',
      properties: {
        count: { type: 'number', description: 'Number of results' },
      },
    },
  },
}
