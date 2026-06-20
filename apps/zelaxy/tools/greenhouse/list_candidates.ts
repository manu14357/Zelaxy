import type { GreenhouseListResponse, ListCandidatesParams } from '@/tools/greenhouse/types'
import type { ToolConfig } from '@/tools/types'

export const listCandidatesTool: ToolConfig<ListCandidatesParams, GreenhouseListResponse> = {
  id: 'greenhouse_list_candidates',
  name: 'Greenhouse List Candidates',
  description: 'List candidates from Greenhouse, optionally filtered by job or email',
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
      description: 'Filter to candidates who applied to this job ID',
    },
    email: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter to candidates with this email address',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://harvest.greenhouse.io/v1/candidates')
      if (params.per_page) url.searchParams.append('per_page', String(params.per_page))
      if (params.page) url.searchParams.append('page', String(params.page))
      if (params.job_id) url.searchParams.append('job_id', params.job_id)
      if (params.email) url.searchParams.append('email', params.email)
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
    const candidates = Array.isArray(data) ? data : []
    return {
      success: true,
      output: { data: candidates, metadata: { count: candidates.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Greenhouse candidate objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
      },
    },
  },
}
