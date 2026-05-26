import type {
  DuckDuckGoNewsSearchParams,
  DuckDuckGoNewsSearchResponse,
} from '@/tools/duckduckgo/types'
import type { ToolConfig } from '@/tools/types'

export const newsSearchTool: ToolConfig<DuckDuckGoNewsSearchParams, DuckDuckGoNewsSearchResponse> =
  {
    id: 'duckduckgo_news_search',
    name: 'DuckDuckGo News Search',
    description:
      'Search for recent news articles using DuckDuckGo. Returns news results with titles, URLs, sources, dates, and excerpts.',
    version: '1.0.0',

    params: {
      query: {
        type: 'string',
        required: true,
        visibility: 'user-or-llm',
        description: 'The news search query to execute',
      },
      maxResults: {
        type: 'number',
        required: false,
        visibility: 'user-only',
        description: 'Maximum number of results to return (default: 10)',
      },
      region: {
        type: 'string',
        required: false,
        visibility: 'user-only',
        description: 'Region code for localized results (e.g., wt-wt, us-en)',
      },
    },

    request: {
      url: (params) => {
        const searchParams = new URLSearchParams({
          q: params.query,
          format: 'json',
          ia: 'news',
          iax: 'news',
        })
        if (params.region) searchParams.append('kl', params.region)
        return `https://api.duckduckgo.com/?${searchParams.toString()}`
      },
      method: 'GET',
      headers: () => ({
        Accept: 'application/json',
      }),
    },

    transformResponse: async (response: Response) => {
      const data = await response.json()
      const maxResults = 10

      const results = (data.RelatedTopics || []).slice(0, maxResults).map((topic: any) => ({
        title: topic.Text?.split(' - ')?.[0] || topic.Text || '',
        url: topic.FirstURL || '',
        source: topic.Text?.split(' - ')?.[1] || '',
        date: '',
        excerpt: topic.Text || '',
      }))

      return {
        success: true,
        output: { results },
      }
    },

    outputs: {
      results: {
        type: 'array',
        description: 'Array of news results',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'News article title' },
            url: { type: 'string', description: 'URL to the news article' },
            source: { type: 'string', description: 'News source name' },
            date: { type: 'string', description: 'Publication date' },
            excerpt: { type: 'string', description: 'Article excerpt or description' },
          },
        },
      },
    },
  }
