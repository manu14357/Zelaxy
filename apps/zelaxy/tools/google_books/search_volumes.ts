import type { GoogleBooksListResponse, SearchVolumesParams } from '@/tools/google_books/types'
import type { ToolConfig } from '@/tools/types'

export const searchVolumesTool: ToolConfig<SearchVolumesParams, GoogleBooksListResponse> = {
  id: 'google_books_search_volumes',
  name: 'Google Books Search Volumes',
  description: 'Search for books using the Google Books API',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Google Books API key',
    },
    q: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description:
        'Search query. Supports keywords like intitle:, inauthor:, inpublisher:, subject:, isbn:',
    },
    maxResults: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of results to return (1-40, default 10)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://www.googleapis.com/books/v1/volumes')
      url.searchParams.append('q', params.q)
      url.searchParams.append('key', params.apiKey)
      url.searchParams.append('maxResults', String(params.maxResults ?? 10))
      return url.toString()
    },
    method: 'GET',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const items = data.items || []
    return {
      success: true,
      output: {
        data: items,
        metadata: { totalItems: data.totalItems ?? 0, count: items.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of matching volume objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        totalItems: { type: 'number', description: 'Total number of matching results' },
        count: { type: 'number', description: 'Number of volumes returned' },
      },
    },
  },
}
