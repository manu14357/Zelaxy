import type { SpotifyListResponse, SpotifySearchParams } from '@/tools/spotify/types'
import type { ToolConfig } from '@/tools/types'

export const searchTool: ToolConfig<SpotifySearchParams, SpotifyListResponse> = {
  id: 'spotify_search',
  name: 'Spotify Search',
  description: 'Search Spotify for tracks or artists',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Spotify access token',
    },
    query: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Search query',
    },
    type: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Type of item to search for: track or artist',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to return (default 20, max 50)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.spotify.com/v1/search')
      url.searchParams.append('q', params.query)
      url.searchParams.append('type', params.type || 'track')
      if (params.limit) url.searchParams.append('limit', String(params.limit))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const items = data.tracks?.items || data.artists?.items || []
    return {
      success: true,
      output: {
        data: items,
        metadata: { count: items.length, total: data.tracks?.total ?? data.artists?.total ?? 0 },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of matching Spotify items' },
    metadata: {
      type: 'json',
      description: 'Search metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
        total: { type: 'number', description: 'Total number of matches available' },
      },
    },
  },
}
