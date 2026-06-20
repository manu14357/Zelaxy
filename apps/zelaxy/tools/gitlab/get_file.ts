import type { GitlabGetFileParams, GitlabObjectResponse } from '@/tools/gitlab/types'
import type { ToolConfig } from '@/tools/types'

export const getFileTool: ToolConfig<GitlabGetFileParams, GitlabObjectResponse> = {
  id: 'gitlab_get_file',
  name: 'GitLab Get File',
  description: 'Get a file from a GitLab project repository',
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
    filePath: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Path of the file in the repository (e.g., "src/index.ts")',
    },
    ref: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The branch, tag, or commit to retrieve the file from (e.g., "main")',
    },
  },

  request: {
    url: (params) => {
      const encodedId = encodeURIComponent(String(params.projectId))
      const encodedPath = encodeURIComponent(String(params.filePath))
      const url = new URL(
        `https://gitlab.com/api/v4/projects/${encodedId}/repository/files/${encodedPath}`
      )
      url.searchParams.append('ref', params.ref)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      'PRIVATE-TOKEN': params.apiKey,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data.file_path ?? data.blob_id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The GitLab file object (includes base64 content)' },
    metadata: {
      type: 'json',
      description: 'File identifiers',
      properties: {
        id: { type: 'string', description: 'File path or blob ID' },
      },
    },
  },
}
