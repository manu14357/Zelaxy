import type { DirectionsParams, GoogleMapsObjectResponse } from '@/tools/google_maps/types'
import type { ToolConfig } from '@/tools/types'

export const directionsTool: ToolConfig<DirectionsParams, GoogleMapsObjectResponse> = {
  id: 'google_maps_directions',
  name: 'Google Maps Directions',
  description: 'Get directions and route information between two locations',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Google Maps API key',
    },
    origin: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Starting location (address or "lat,lng")',
    },
    destination: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Destination location (address or "lat,lng")',
    },
    mode: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Travel mode: driving, walking, bicycling, or transit',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://maps.googleapis.com/maps/api/directions/json')
      url.searchParams.append('origin', params.origin)
      url.searchParams.append('destination', params.destination)
      url.searchParams.append('key', params.apiKey)
      if (params.mode) url.searchParams.append('mode', params.mode)
      return url.toString()
    },
    method: 'GET',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const routes = data.routes || []
    return {
      success: true,
      output: {
        data: routes,
        metadata: { status: data.status, count: routes.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of route options' },
    metadata: {
      type: 'json',
      description: 'Response metadata',
      properties: {
        status: { type: 'string', description: 'API response status' },
        count: { type: 'number', description: 'Number of routes returned' },
      },
    },
  },
}
