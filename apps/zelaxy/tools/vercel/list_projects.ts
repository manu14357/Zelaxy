import type { ToolConfig } from '@/tools/types'
import type { VercelListProjectsParams, VercelListResponse } from '@/tools/vercel/types'

export const listProjectsTool: ToolConfig<VercelListProjectsParams, VercelListResponse> = {
  id: 'vercel_list_projects',
  name: 'Vercel List Projects',
  description: 'List projects in a Vercel team or account',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Vercel access token',
    },
    search: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Search projects by name',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of projects to return',
    },
    teamId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Team ID to scope the request',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.vercel.com/v9/projects')
      if (params.search) url.searchParams.append('search', params.search)
      if (params.limit) url.searchParams.append('limit', String(params.limit))
      if (params.teamId) url.searchParams.append('teamId', params.teamId)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const projects = data.projects || []
    return {
      success: true,
      output: {
        data: projects,
        metadata: { count: projects.length, hasMore: data.pagination?.next != null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Vercel project objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of projects returned' },
        hasMore: { type: 'boolean', description: 'Whether more projects exist beyond this page' },
      },
    },
  },
}
