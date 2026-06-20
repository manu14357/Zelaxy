import { directionsTool } from '@/tools/google_maps/directions'
import { geocodeTool } from '@/tools/google_maps/geocode'
import { placeSearchTool } from '@/tools/google_maps/place_search'
import { reverseGeocodeTool } from '@/tools/google_maps/reverse_geocode'

export const googleMapsGeocodeTool = geocodeTool
export const googleMapsReverseGeocodeTool = reverseGeocodeTool
export const googleMapsPlaceSearchTool = placeSearchTool
export const googleMapsDirectionsTool = directionsTool
