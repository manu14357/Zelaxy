import type { SpotifyGetArtistParams, SpotifyObjectResponse } from '@/tools/spotify/types'
import type { ToolConfig } from '@/tools/types'

export const getArtistTool: ToolConfig<SpotifyGetArtistParams, SpotifyObjectResponse> = {
  id: 'spotify_get_artist',
  name: 'Spotify Get Artist',
  description: 'Get detailed information about a Spotify artist by its ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Spotify access token',
    },
    artistId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The Spotify ID of the artist',
    },
  },

  request: {
    url: (params) => `https://api.spotify.com/v1/artists/${params.artistId}`,
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
    data: { type: 'json', description: 'The Spotify artist object' },
    metadata: {
      type: 'json',
      description: 'Artist identifiers',
      properties: {
        id: { type: 'string', description: 'Artist ID' },
        type: { type: 'string', description: 'Object type' },
      },
    },
  },
}
