import { GoogleMapsIcon } from '@/components/icons/google-maps-icon'
import type { BlockConfig } from '@/blocks/types'
import type { GoogleMapsResponse } from '@/tools/google_maps/types'

export const GoogleMapsBlock: BlockConfig<GoogleMapsResponse> = {
  type: 'google_maps',
  name: 'Google Maps',
  description: 'Geocode addresses, search places, and get directions',
  longDescription:
    'Convert addresses to coordinates and back, search for places by text query, and get directions between locations using the Google Maps Platform APIs. Authenticate with a Google Maps API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#34A853',
  icon: GoogleMapsIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Geocode', id: 'google_maps_geocode' },
        { label: 'Reverse geocode', id: 'google_maps_reverse_geocode' },
        { label: 'Place search', id: 'google_maps_place_search' },
        { label: 'Directions', id: 'google_maps_directions' },
      ],
      value: () => 'google_maps_geocode',
    },
    // Geocode
    {
      id: 'address',
      title: 'Address',
      type: 'short-input',
      layout: 'full',
      placeholder: '1600 Amphitheatre Parkway, Mountain View, CA',
      condition: { field: 'operation', value: 'google_maps_geocode' },
    },
    // Reverse geocode
    {
      id: 'latlng',
      title: 'Coordinates (lat,lng)',
      type: 'short-input',
      layout: 'full',
      placeholder: '40.714224,-73.961452',
      condition: { field: 'operation', value: 'google_maps_reverse_geocode' },
    },
    // Place search
    {
      id: 'query',
      title: 'Query',
      type: 'short-input',
      layout: 'full',
      placeholder: 'restaurants in Times Square',
      condition: { field: 'operation', value: 'google_maps_place_search' },
    },
    // Directions
    {
      id: 'origin',
      title: 'Origin',
      type: 'short-input',
      layout: 'half',
      placeholder: 'New York, NY',
      condition: { field: 'operation', value: 'google_maps_directions' },
    },
    {
      id: 'destination',
      title: 'Destination',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Boston, MA',
      condition: { field: 'operation', value: 'google_maps_directions' },
    },
    {
      id: 'mode',
      title: 'Travel Mode',
      type: 'short-input',
      layout: 'half',
      placeholder: 'driving, walking, bicycling, transit',
      condition: { field: 'operation', value: 'google_maps_directions' },
    },
    {
      id: 'apiKey',
      title: 'Google Maps API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your Google Maps API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'google_maps_geocode',
      'google_maps_reverse_geocode',
      'google_maps_place_search',
      'google_maps_directions',
    ],
    config: {
      tool: (params) => params.operation || 'google_maps_geocode',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Google Maps API key' },
    address: { type: 'string', description: 'Address to geocode' },
    latlng: { type: 'string', description: 'Coordinates as lat,lng' },
    query: { type: 'string', description: 'Place search query' },
    origin: { type: 'string', description: 'Directions origin' },
    destination: { type: 'string', description: 'Directions destination' },
    mode: { type: 'string', description: 'Travel mode' },
  },
  outputs: {
    data: { type: 'json', description: 'Result array from Google Maps' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
