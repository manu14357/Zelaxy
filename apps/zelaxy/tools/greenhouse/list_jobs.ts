import type { GreenhouseListResponse, ListJobsParams } from '@/tools/greenhouse/types'
import type { ToolConfig } from '@/tools/types'

export const listJobsTool: ToolConfig<ListJobsParams, GreenhouseListResponse> = {
  id: 'greenhouse_list_jobs',
  name: 'Greenhouse List Jobs',
  description: 'List jobs from Greenhouse, optionally filtered by status',
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
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by status (open, closed, draft)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://harvest.greenhouse.io/v1/jobs')
      if (params.per_page) url.searchParams.append('per_page', String(params.per_page))
      if (params.page) url.searchParams.append('page', String(params.page))
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
    const jobs = Array.isArray(data) ? data : []
    return {
      success: true,
      output: { data: jobs, metadata: { count: jobs.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Greenhouse job objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
      },
    },
  },
}
