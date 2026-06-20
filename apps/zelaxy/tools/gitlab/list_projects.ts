import type { GitlabListProjectsParams, GitlabListResponse } from '@/tools/gitlab/types'
import type { ToolConfig } from '@/tools/types'

export const listProjectsTool: ToolConfig<GitlabListProjectsParams, GitlabListResponse> = {
  id: 'gitlab_list_projects',
  name: 'GitLab List Projects',
  description: 'List GitLab projects the authenticated user is a member of',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'GitLab Personal Access Token',
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
      description: 'Number of results per page (default 20, max 100)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://gitlab.com/api/v4/projects')
      url.searchParams.append('membership', 'true')
      if (params.search) url.searchParams.append('search', params.search)
      if (params.limit) url.searchParams.append('per_page', String(params.limit))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      'PRIVATE-TOKEN': params.apiKey,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const projects = Array.isArray(data) ? data : []
    return {
      success: true,
      output: {
        data: projects,
        metadata: { count: projects.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of GitLab project objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
      },
    },
  },
}
