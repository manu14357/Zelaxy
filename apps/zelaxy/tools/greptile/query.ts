import type { GreptileObjectResponse, QueryParams } from '@/tools/greptile/types'
import type { ToolConfig } from '@/tools/types'

export const queryTool: ToolConfig<QueryParams, GreptileObjectResponse> = {
  id: 'greptile_query',
  name: 'Greptile Query',
  description: 'Ask a natural-language question about indexed repositories and get an answer',
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
      description: 'The natural-language question to ask',
    },
    repositories: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description: 'Array of repository objects to query (e.g. [{ remote, repository, branch }])',
    },
  },

  request: {
    url: () => 'https://api.greptile.com/v2/query',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'X-GitHub-Token': params.githubToken,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      messages: [{ role: 'user', content: params.query }],
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
    data: { type: 'json', description: 'The Greptile query answer and sources' },
    metadata: {
      type: 'json',
      description: 'Response metadata',
      properties: {
        status: { type: 'string', description: 'Query status' },
      },
    },
  },
}
