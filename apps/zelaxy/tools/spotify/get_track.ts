import type { SpotifyGetTrackParams, SpotifyObjectResponse } from '@/tools/spotify/types'
import type { ToolConfig } from '@/tools/types'

export const getTrackTool: ToolConfig<SpotifyGetTrackParams, SpotifyObjectResponse> = {
  id: 'spotify_get_track',
  name: 'Spotify Get Track',
  description: 'Get detailed information about a Spotify track by its ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Spotify access token',
    },
    trackId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The Spotify ID of the track',
    },
  },

  request: {
    url: (params) => `https://api.spotify.com/v1/tracks/${params.trackId}`,
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
    data: { type: 'json', description: 'The Spotify track object' },
    metadata: {
      type: 'json',
      description: 'Track identifiers',
      properties: {
        id: { type: 'string', description: 'Track ID' },
        type: { type: 'string', description: 'Object type' },
      },
    },
  },
}
