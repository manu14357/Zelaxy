import type { GoogleMapsObjectResponse, ReverseGeocodeParams } from '@/tools/google_maps/types'
import type { ToolConfig } from '@/tools/types'

export const reverseGeocodeTool: ToolConfig<ReverseGeocodeParams, GoogleMapsObjectResponse> = {
  id: 'google_maps_reverse_geocode',
  name: 'Google Maps Reverse Geocode',
  description:
    'Convert geographic coordinates into a human-readable address using the Google Maps API',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Google Maps API key',
    },
    latlng: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Latitude and longitude as "lat,lng" (e.g., "40.714,-73.961")',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
      url.searchParams.append('latlng', params.latlng)
      url.searchParams.append('key', params.apiKey)
      return url.toString()
    },
    method: 'GET',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const results = data.results || []
    return {
      success: true,
      output: {
        data: results,
        metadata: { status: data.status, count: results.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of reverse geocoding results' },
    metadata: {
      type: 'json',
      description: 'Response metadata',
      properties: {
        status: { type: 'string', description: 'API response status' },
        count: { type: 'number', description: 'Number of results returned' },
      },
    },
  },
}
