import type { GreenhouseListResponse, ListApplicationsParams } from '@/tools/greenhouse/types'
import type { ToolConfig } from '@/tools/types'

export const listApplicationsTool: ToolConfig<ListApplicationsParams, GreenhouseListResponse> = {
  id: 'greenhouse_list_applications',
  name: 'Greenhouse List Applications',
  description: 'List applications from Greenhouse, optionally filtered by job or status',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Greenhouse Harvest API key',
    },
    per_page: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results per page (1-500, default 100)',
    },
    page: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Page number for pagination',
    },
    job_id: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter applications by job ID',
    },
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by status (active, converted, hired, rejected)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://harvest.greenhouse.io/v1/applications')
      if (params.per_page) url.searchParams.append('per_page', String(params.per_page))
      if (params.page) url.searchParams.append('page', String(params.page))
      if (params.job_id) url.searchParams.append('job_id', params.job_id)
      if (params.status) url.searchParams.append('status', params.status)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`${params.apiKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const applications = Array.isArray(data) ? data : []
    return {
      success: true,
      output: { data: applications, metadata: { count: applications.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Greenhouse application objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
      },
    },
  },
}
