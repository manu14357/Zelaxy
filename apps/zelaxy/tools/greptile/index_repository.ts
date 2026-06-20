import type { GreptileObjectResponse, IndexRepositoryParams } from '@/tools/greptile/types'
import type { ToolConfig } from '@/tools/types'

export const indexRepositoryTool: ToolConfig<IndexRepositoryParams, GreptileObjectResponse> = {
  id: 'greptile_index_repository',
  name: 'Greptile Index Repository',
  description: 'Submit a repository to Greptile for indexing so it can be queried and searched',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Greptile API key',
    },
    githubToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'GitHub access token with read access to the repository',
    },
    remote: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: "Source host of the repository (e.g. 'github')",
    },
    repository: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: "Repository identifier (e.g. 'owner/repo')",
    },
    branch: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Branch to index (defaults to the default branch)',
    },
  },

  request: {
    url: () => 'https://api.greptile.com/v2/repositories',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'X-GitHub-Token': params.githubToken,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = {
        remote: params.remote,
        repository: params.repository,
      }
      if (params.branch) body.branch = params.branch
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { status: data.status } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Greptile indexing job response' },
    metadata: {
      type: 'json',
      description: 'Response metadata',
      properties: {
        status: { type: 'string', description: 'Indexing job status' },
      },
    },
  },
}
