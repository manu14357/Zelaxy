import { getArtistTool } from '@/tools/spotify/get_artist'
import { getPlaylistTool } from '@/tools/spotify/get_playlist'
import { getTrackTool } from '@/tools/spotify/get_track'
import { listMyPlaylistsTool } from '@/tools/spotify/list_my_playlists'
import { searchTool } from '@/tools/spotify/search'

export const spotifySearchTool = searchTool
export const spotifyGetTrackTool = getTrackTool
export const spotifyGetArtistTool = getArtistTool
export const spotifyGetPlaylistTool = getPlaylistTool
export const spotifyListMyPlaylistsTool = listMyPlaylistsTool
