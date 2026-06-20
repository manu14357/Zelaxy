import type { ObsidianResponse, ObsidianSearchParams } from '@/tools/obsidian/types'
import type { ToolConfig } from '@/tools/types'

export const searchTool: ToolConfig<ObsidianSearchParams, ObsidianResponse> = {
  id: 'obsidian_search',
  name: 'Obsidian Search',
  description: 'Search for text across notes in your Obsidian vault',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'API key from the Obsidian Local REST API plugin settings',
    },
    baseUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Base URL for the Obsidian Local REST API (e.g. https://127.0.0.1:27124)',
    },
    query: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Text to search for across vault notes',
    },
  },

  request: {
    url: (params) => {
      const base = params.baseUrl.replace(/\/$/, '')
      return `${base}/search/simple/?query=${encodeURIComponent(params.query)}`
    },
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      Accept: 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const results = Array.isArray(data) ? data : []
    return {
      success: true,
      output: { data: results, metadata: { count: results.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Search results with filenames, scores, and contexts' },
    metadata: {
      type: 'json',
      description: 'Search metadata',
      properties: {
        count: { type: 'number', description: 'Number of matching notes returned' },
      },
    },
  },
}
