import type { ToolConfig } from '@/tools/types'
import type { ListSitesParams, WebflowListResponse } from '@/tools/webflow/types'

export const listSitesTool: ToolConfig<ListSitesParams, WebflowListResponse> = {
  id: 'webflow_list_sites',
  name: 'Webflow List Sites',
  description: 'List all Webflow sites accessible to the authenticated account',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Webflow API token',
    },
  },

  request: {
    url: () => 'https://api.webflow.com/v2/sites',
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const sites = data.sites || []
    return {
      success: true,
      output: {
        data: sites,
        metadata: { count: sites.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Webflow site objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
      },
    },
  },
}
