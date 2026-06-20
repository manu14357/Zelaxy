import type { ToolResponse } from '@/tools/types'

export interface GoogleSlidesBaseParams {
  accessToken: string
}

export interface GetPresentationParams extends GoogleSlidesBaseParams {
  presentationId: string
}

export interface CreatePresentationParams extends GoogleSlidesBaseParams {
  title: string
}

export interface BatchUpdateParams extends GoogleSlidesBaseParams {
  presentationId: string
  requests: any[]
}

export interface GoogleSlidesObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { presentationId: string }
  }
}

export type GoogleSlidesResponse = GoogleSlidesObjectResponse
