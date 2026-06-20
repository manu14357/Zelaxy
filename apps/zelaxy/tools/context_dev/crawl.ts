import type { ContextDevListResponse, CrawlParams } from '@/tools/context_dev/types'
import type { ToolConfig } from '@/tools/types'

export const crawlTool: ToolConfig<CrawlParams, ContextDevListResponse> = {
  id: 'context_dev_crawl',
  name: 'Context.dev Crawl',
  description: 'Crawl an entire website and return each discovered page as clean markdown',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Context.dev API key',
    },
    url: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The starting URL to crawl (must include http:// or https://)',
    },
    maxPages: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of pages to crawl (1-500, default: 100)',
    },
    maxDepth: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum link depth from the starting URL (0 = start page only)',
    },
  },

  request: {
    url: () => 'https://api.context.dev/v1/web/crawl',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = { url: params.url }
      if (params.maxPages != null) body.maxPages = params.maxPages
      if (params.maxDepth != null) body.maxDepth = params.maxDepth
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
    data: { type: 'json', description: 'Array of crawled pages with markdown content' },
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
