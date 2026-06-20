import type { ToolResponse } from '@/tools/types'

export interface GoogleMapsBaseParams {
  apiKey: string
}

export interface GeocodeParams extends GoogleMapsBaseParams {
  address: string
}

export interface ReverseGeocodeParams extends GoogleMapsBaseParams {
  latlng: string
}

export interface PlaceSearchParams extends GoogleMapsBaseParams {
  query: string
}

export interface DirectionsParams extends GoogleMapsBaseParams {
  origin: string
  destination: string
  mode?: string
}

export interface GoogleMapsObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { status: string; count: number }
  }
}

export type GoogleMapsResponse = GoogleMapsObjectResponse
