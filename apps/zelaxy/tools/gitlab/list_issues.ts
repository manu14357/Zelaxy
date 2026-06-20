import type { GitlabListIssuesParams, GitlabListResponse } from '@/tools/gitlab/types'
import type { ToolConfig } from '@/tools/types'

export const listIssuesTool: ToolConfig<GitlabListIssuesParams, GitlabListResponse> = {
  id: 'gitlab_list_issues',
  name: 'GitLab List Issues',
  description: 'List issues in a GitLab project',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'GitLab Personal Access Token',
    },
    projectId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Project ID or URL-encoded path',
    },
    state: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by state (opened, closed, all)',
    },
    labels: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated list of label names',
    },
  },

  request: {
    url: (params) => {
      const encodedId = encodeURIComponent(String(params.projectId))
      const url = new URL(`https://gitlab.com/api/v4/projects/${encodedId}/issues`)
      if (params.state) url.searchParams.append('state', params.state)
      if (params.labels) url.searchParams.append('labels', params.labels)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      'PRIVATE-TOKEN': params.apiKey,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const issues = Array.isArray(data) ? data : []
    return {
      success: true,
      output: {
        data: issues,
        metadata: { count: issues.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of GitLab issue objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
      },
    },
  },
}
