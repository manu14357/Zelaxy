import type { ContextDevListResponse, SearchParams } from '@/tools/context_dev/types'
import type { ToolConfig } from '@/tools/types'

export const searchTool: ToolConfig<SearchParams, ContextDevListResponse> = {
  id: 'context_dev_search',
  name: 'Context.dev Search',
  description: 'Search the web with natural language and optionally scrape results to markdown',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Context.dev API key',
    },
    query: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The natural-language search query',
    },
    markdownEnabled: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Scrape each result page to markdown (default: false)',
    },
  },

  request: {
    url: () => 'https://api.context.dev/v1/web/search',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = { query: params.query }
      if (params.markdownEnabled != null) {
        body.markdownOptions = { enabled: params.markdownEnabled }
      }
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const results = data.results || []
    return {
      success: true,
      output: {
        data: results,
        metadata: {
          creditsConsumed: data.key_metadata?.credits_consumed ?? null,
          creditsRemaining: data.key_metadata?.credits_remaining ?? null,
        },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of search result objects' },
    metadata: {
      type: 'json',
      description: 'Credit accounting metadata',
      properties: {
        creditsConsumed: { type: 'number', description: 'Credits consumed by this request' },
        creditsRemaining: { type: 'number', description: 'Credits remaining on the API key' },
      },
    },
  },
}
