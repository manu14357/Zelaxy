import type { GreptileObjectResponse, SearchParams } from '@/tools/greptile/types'
import type { ToolConfig } from '@/tools/types'

export const searchTool: ToolConfig<SearchParams, GreptileObjectResponse> = {
  id: 'greptile_search',
  name: 'Greptile Search',
  description: 'Search indexed repositories for relevant files and code references',
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
      description: 'GitHub access token with read access to the repositories',
    },
    query: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The search query',
    },
    repositories: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description: 'Array of repository objects to search (e.g. [{ remote, repository, branch }])',
    },
  },

  request: {
    url: () => 'https://api.greptile.com/v2/search',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'X-GitHub-Token': params.githubToken,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      query: params.query,
      repositories: params.repositories,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { status: 'completed' } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Greptile search results' },
    metadata: {
      type: 'json',
      description: 'Response metadata',
      properties: {
        status: { type: 'string', description: 'Search status' },
      },
    },
  },
}
