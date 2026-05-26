import type { ToolConfig } from '@/tools/types'

export const dropboxSearchFilesTool: ToolConfig = {
  id: 'dropbox_search_files',
  name: 'Dropbox Search Files',
  description: 'Search for files and folders in Dropbox.',
  version: '1.0.0',

  oauth: {
    required: true,
    provider: 'dropbox',
  },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'Dropbox OAuth access token',
    },
    query: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Search query string',
    },
  },

  request: {
    url: 'https://api.dropboxapi.com/2/files/search_v2',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      query: params.query,
      options: { max_results: 100 },
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(
        (data as { error_summary?: string }).error_summary || `HTTP ${response.status}`
      )
    }
    return {
      success: true,
      output: {
        matches: data.matches ?? [],
        cursor: data.cursor ?? null,
        hasMore: data.has_more ?? false,
      },
    }
  },

  outputs: {
    matches: { type: 'json', description: 'Array of matching files and folders' },
    cursor: { type: 'string', description: 'Pagination cursor', optional: true },
    hasMore: { type: 'boolean', description: 'Whether more results are available' },
  },
}
