import type { PeopleDataLabsListResponse, PersonSearchParams } from '@/tools/peopledatalabs/types'
import type { ToolConfig } from '@/tools/types'

export const personSearchTool: ToolConfig<PersonSearchParams, PeopleDataLabsListResponse> = {
  id: 'peopledatalabs_person_search',
  name: 'People Data Labs Person Search',
  description: 'Search the People Data Labs person dataset by query or SQL',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'People Data Labs API key',
    },
    query: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Elasticsearch DSL query object. Use either query or sql, not both.',
    },
    sql: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'PDL SQL query string. Use either query or sql, not both.',
    },
    size: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to return (1-100, default 1)',
    },
  },

  request: {
    url: () => 'https://api.peopledatalabs.com/v5/person/search',
    method: 'POST',
    headers: (params) => ({
      'X-Api-Key': params.apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = {}
      if (params.query) body.query = params.query
      if (params.sql) body.sql = params.sql
      if (params.size) body.size = params.size
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data: data.data || [],
        metadata: {
          status: data.status ?? response.status,
          total: data.total ?? (data.data || []).length,
        },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of matching person records' },
    metadata: {
      type: 'json',
      description: 'Search metadata',
      properties: {
        status: { type: 'number', description: 'API status code' },
        total: { type: 'number', description: 'Total matching records in the dataset' },
      },
    },
  },
}
