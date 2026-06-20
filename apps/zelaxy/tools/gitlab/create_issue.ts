import type { GitlabCreateIssueParams, GitlabObjectResponse } from '@/tools/gitlab/types'
import type { ToolConfig } from '@/tools/types'

export const createIssueTool: ToolConfig<GitlabCreateIssueParams, GitlabObjectResponse> = {
  id: 'gitlab_create_issue',
  name: 'GitLab Create Issue',
  description: 'Create a new issue in a GitLab project',
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
    title: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Issue title',
    },
    description: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Issue description (Markdown supported)',
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
      url.searchParams.append('title', params.title)
      if (params.description) url.searchParams.append('description', params.description)
      if (params.labels) url.searchParams.append('labels', params.labels)
      return url.toString()
    },
    method: 'POST',
    headers: (params) => ({
      'PRIVATE-TOKEN': params.apiKey,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The created GitLab issue object' },
    metadata: {
      type: 'json',
      description: 'Issue identifiers',
      properties: {
        id: { type: 'number', description: 'Issue ID' },
      },
    },
  },
}
