import type { ToolResponse } from '@/tools/types'

export interface SpotifyBaseParams {
  apiKey: string
}

export interface SpotifySearchParams extends SpotifyBaseParams {
  query: string
  type?: string
  limit?: number
}

export interface SpotifyGetTrackParams extends SpotifyBaseParams {
  trackId: string
}

export interface SpotifyGetArtistParams extends SpotifyBaseParams {
  artistId: string
}

export interface SpotifyGetPlaylistParams extends SpotifyBaseParams {
  playlistId: string
}

export interface SpotifyListMyPlaylistsParams extends SpotifyBaseParams {
  limit?: number
}

export interface SpotifyObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string; type?: string }
  }
}

export interface SpotifyListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; total?: number }
  }
}

export type SpotifyResponse = SpotifyObjectResponse | SpotifyListResponse
