import type { ToolConfig } from '@/tools/types'

export const enrichSearchPeopleTool: ToolConfig = {
  id: 'enrich_search_people',
  name: 'Enrich Search People',
  description: 'Search for people profiles using various filters.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Enrich API key',
    },
    firstName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'First name filter',
    },
    lastName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Last name filter',
    },
    summary: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Summary/bio keywords filter',
    },
    subTitle: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Job subtitle/headline filter',
    },
    locationCountry: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Country filter',
    },
    currentPage: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Page number for pagination',
    },
  },

  request: {
    url: 'https://api.enrich.so/v1/api/search-people',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      ...(params.firstName ? { firstName: params.firstName } : {}),
      ...(params.lastName ? { lastName: params.lastName } : {}),
      ...(params.summary ? { summary: params.summary } : {}),
      ...(params.subTitle ? { subTitle: params.subTitle } : {}),
      ...(params.locationCountry ? { locationCountry: params.locationCountry } : {}),
      ...(params.currentPage ? { currentPage: Number(params.currentPage) } : {}),
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error((data as { message?: string }).message || `HTTP ${response.status}`)
    }
    return {
      success: true,
      output: {
        people: data.people ?? [],
        total: data.total ?? 0,
      },
    }
  },

  outputs: {
    people: { type: 'json', description: 'Array of matching people profiles' },
    total: { type: 'number', description: 'Total number of matches' },
  },
}
