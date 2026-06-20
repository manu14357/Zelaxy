import type { SpotifyGetPlaylistParams, SpotifyObjectResponse } from '@/tools/spotify/types'
import type { ToolConfig } from '@/tools/types'

export const getPlaylistTool: ToolConfig<SpotifyGetPlaylistParams, SpotifyObjectResponse> = {
  id: 'spotify_get_playlist',
  name: 'Spotify Get Playlist',
  description: 'Get detailed information about a Spotify playlist by its ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Spotify access token',
    },
    playlistId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The Spotify ID of the playlist',
    },
  },

  request: {
    url: (params) => `https://api.spotify.com/v1/playlists/${params.playlistId}`,
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
      output: { data, metadata: { id: data.id, type: data.type } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Spotify playlist object' },
    metadata: {
      type: 'json',
      description: 'Playlist identifiers',
      properties: {
        id: { type: 'string', description: 'Playlist ID' },
        type: { type: 'string', description: 'Object type' },
      },
    },
  },
}
