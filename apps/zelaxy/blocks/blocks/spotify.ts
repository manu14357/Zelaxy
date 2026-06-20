import { SpotifyIcon } from '@/components/icons/spotify-icon'
import type { BlockConfig } from '@/blocks/types'
import type { SpotifyResponse } from '@/tools/spotify/types'

export const SpotifyBlock: BlockConfig<SpotifyResponse> = {
  type: 'spotify',
  name: 'Spotify',
  description: 'Search and fetch tracks, artists, and playlists from Spotify',
  longDescription:
    'Search Spotify for tracks and artists, retrieve track, artist, and playlist details, and list your own playlists through the Spotify Web API. Authenticate with a Spotify access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#1DB954',
  icon: SpotifyIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Search', id: 'spotify_search' },
        { label: 'Get track', id: 'spotify_get_track' },
        { label: 'Get artist', id: 'spotify_get_artist' },
        { label: 'Get playlist', id: 'spotify_get_playlist' },
        { label: 'List my playlists', id: 'spotify_list_my_playlists' },
      ],
      value: () => 'spotify_search',
    },
    // Search
    {
      id: 'query',
      title: 'Query',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Bohemian Rhapsody',
      condition: { field: 'operation', value: 'spotify_search' },
    },
    {
      id: 'type',
      title: 'Type',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'Track', id: 'track' },
        { label: 'Artist', id: 'artist' },
      ],
      value: () => 'track',
      condition: { field: 'operation', value: 'spotify_search' },
    },
    // Get track
    {
      id: 'trackId',
      title: 'Track ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '11dFghVXANMlKmJXsNCbNl',
      condition: { field: 'operation', value: 'spotify_get_track' },
    },
    // Get artist
    {
      id: 'artistId',
      title: 'Artist ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '0OdUWJ0sBjDrqHygGUXeCF',
      condition: { field: 'operation', value: 'spotify_get_artist' },
    },
    // Get playlist
    {
      id: 'playlistId',
      title: 'Playlist ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '37i9dQZF1DXcBWIGoYBM5M',
      condition: { field: 'operation', value: 'spotify_get_playlist' },
    },
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '20',
      condition: {
        field: 'operation',
        value: ['spotify_search', 'spotify_list_my_playlists'],
      },
    },
    {
      id: 'apiKey',
      title: 'Spotify Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'BQ...',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'spotify_search',
      'spotify_get_track',
      'spotify_get_artist',
      'spotify_get_playlist',
      'spotify_list_my_playlists',
    ],
    config: {
      tool: (params) => params.operation || 'spotify_search',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Spotify access token' },
    query: { type: 'string', description: 'Search query' },
    type: { type: 'string', description: 'Search item type' },
    trackId: { type: 'string', description: 'Track ID' },
    artistId: { type: 'string', description: 'Artist ID' },
    playlistId: { type: 'string', description: 'Playlist ID' },
    limit: { type: 'number', description: 'Result limit' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Spotify' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
