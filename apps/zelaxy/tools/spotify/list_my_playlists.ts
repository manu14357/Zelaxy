import type { SpotifyListMyPlaylistsParams, SpotifyListResponse } from '@/tools/spotify/types'
import type { ToolConfig } from '@/tools/types'

export const listMyPlaylistsTool: ToolConfig<SpotifyListMyPlaylistsParams, SpotifyListResponse> = {
  id: 'spotify_list_my_playlists',
  name: 'Spotify List My Playlists',
  description: "List the current user's Spotify playlists",
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Spotify access token',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of playlists to return (default 20, max 50)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.spotify.com/v1/me/playlists')
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
    return {
      success: true,
      output: {
        data: data.items || [],
        metadata: { count: (data.items || []).length, total: data.total || 0 },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Spotify playlist objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
        total: { type: 'number', description: 'Total number of playlists' },
      },
    },
  },
}
