import type { GitlabGetProjectParams, GitlabObjectResponse } from '@/tools/gitlab/types'
import type { ToolConfig } from '@/tools/types'

export const getProjectTool: ToolConfig<GitlabGetProjectParams, GitlabObjectResponse> = {
  id: 'gitlab_get_project',
  name: 'GitLab Get Project',
  description: 'Get details of a specific GitLab project',
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
      description: 'Project ID or URL-encoded path (e.g., "namespace/project")',
    },
  },

  request: {
    url: (params) =>
      `https://gitlab.com/api/v4/projects/${encodeURIComponent(String(params.projectId))}`,
    method: 'GET',
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
    data: { type: 'json', description: 'The GitLab project object' },
    metadata: {
      type: 'json',
      description: 'Project identifiers',
      properties: {
        id: { type: 'number', description: 'Project ID' },
      },
    },
  },
}
