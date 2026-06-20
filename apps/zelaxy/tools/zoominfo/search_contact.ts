import type { ToolConfig } from '@/tools/types'
import type { SearchContactParams, ZoomInfoObjectResponse } from '@/tools/zoominfo/types'

export const searchContactTool: ToolConfig<SearchContactParams, ZoomInfoObjectResponse> = {
  id: 'zoominfo_search_contact',
  name: 'ZoomInfo Search Contact',
  description: 'Search ZoomInfo for contacts by name, job title, and company',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'ZoomInfo Bearer token',
    },
    firstName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'First name to search for',
    },
    lastName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Last name to search for',
    },
    jobTitle: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Job title to filter by',
    },
    companyName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Company name to filter by',
    },
    rpp: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Results per page (1-100, default 25)',
    },
  },

  request: {
    url: () => 'https://api.zoominfo.com/search/contact',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = {}
      if (params.firstName) body.firstName = params.firstName
      if (params.lastName) body.lastName = params.lastName
      if (params.jobTitle) body.jobTitle = params.jobTitle
      if (params.companyName) body.companyName = params.companyName
      if (params.rpp) body.rpp = params.rpp
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const results = data?.data ?? []
    return {
      success: true,
      output: {
        data,
        metadata: { count: Array.isArray(results) ? results.length : 0 },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The search result object from ZoomInfo' },
    metadata: {
      type: 'json',
      description: 'Response metadata',
      properties: {
        count: { type: 'number', description: 'Number of contacts returned' },
      },
    },
  },
}
