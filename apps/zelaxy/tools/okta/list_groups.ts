import type { OktaListGroupsParams, OktaListResponse } from '@/tools/okta/types'
import type { ToolConfig } from '@/tools/types'

export const listGroupsTool: ToolConfig<OktaListGroupsParams, OktaListResponse> = {
  id: 'okta_list_groups',
  name: 'Okta List Groups',
  description: 'List groups in your Okta organization with optional search',
  version: '1.0.0',

  params: {
    orgUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Okta org URL (e.g. https://your-org.okta.com)',
    },
    apiToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Okta API token',
    },
    search: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Okta search expression (e.g. profile.name sw "Engineering")',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of groups to return',
    },
  },

  request: {
    url: (params) => {
      const baseUrl = params.orgUrl.trim().replace(/\/$/, '')
      const url = new URL(`${baseUrl}/api/v1/groups`)
      if (params.search) url.searchParams.append('search', params.search)
      if (params.limit) url.searchParams.append('limit', String(params.limit))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `SSWS ${params.apiToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const groups = Array.isArray(data) ? data : []
    return {
      success: true,
      output: {
        data: groups,
        metadata: { count: groups.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Okta group objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of groups returned' },
      },
    },
  },
}
