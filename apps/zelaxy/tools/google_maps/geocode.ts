import type { GeocodeParams, GoogleMapsObjectResponse } from '@/tools/google_maps/types'
import type { ToolConfig } from '@/tools/types'

export const geocodeTool: ToolConfig<GeocodeParams, GoogleMapsObjectResponse> = {
  id: 'google_maps_geocode',
  name: 'Google Maps Geocode',
  description: 'Convert an address into geographic coordinates using the Google Maps API',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Google Maps API key',
    },
    address: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The address to geocode',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
      url.searchParams.append('address', params.address)
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
    data: { type: 'json', description: 'Array of geocoding results' },
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
