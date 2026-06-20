import type { GoogleMapsObjectResponse, PlaceSearchParams } from '@/tools/google_maps/types'
import type { ToolConfig } from '@/tools/types'

export const placeSearchTool: ToolConfig<PlaceSearchParams, GoogleMapsObjectResponse> = {
  id: 'google_maps_place_search',
  name: 'Google Maps Place Search',
  description: 'Search for places using a text query with the Google Maps Places API',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Google Maps API key',
    },
    query: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Search query (e.g., "restaurants in Times Square")',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
      url.searchParams.append('query', params.query)
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
    data: { type: 'json', description: 'Array of places matching the query' },
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
