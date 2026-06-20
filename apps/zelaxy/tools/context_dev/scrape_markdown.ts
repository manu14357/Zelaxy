import type { ContextDevObjectResponse, ScrapeMarkdownParams } from '@/tools/context_dev/types'
import type { ToolConfig } from '@/tools/types'

export const scrapeMarkdownTool: ToolConfig<ScrapeMarkdownParams, ContextDevObjectResponse> = {
  id: 'context_dev_scrape_markdown',
  name: 'Context.dev Scrape Markdown',
  description: 'Scrape any URL and return clean, LLM-ready markdown content',
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
      description: 'The full URL to scrape (must include http:// or https://)',
    },
    useMainContentOnly: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Return only main content, excluding headers, footers, and navigation',
    },
    includeLinks: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Preserve hyperlinks in the markdown output (default: true)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.context.dev/v1/web/scrape/markdown')
      url.searchParams.append('url', params.url)
      if (params.useMainContentOnly != null) {
        url.searchParams.append('useMainContentOnly', String(params.useMainContentOnly))
      }
      if (params.includeLinks != null) {
        url.searchParams.append('includeLinks', String(params.includeLinks))
      }
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      Accept: 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data: { markdown: data.markdown ?? '', url: data.url ?? '' },
        metadata: {
          creditsConsumed: data.key_metadata?.credits_consumed ?? null,
          creditsRemaining: data.key_metadata?.credits_remaining ?? null,
        },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The scraped page markdown and URL' },
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
