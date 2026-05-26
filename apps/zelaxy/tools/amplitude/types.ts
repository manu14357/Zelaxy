import type { ToolResponse } from '@/tools/types'

interface AmplitudeApiKeyParams {
  apiKey: string
}

interface AmplitudeBasicAuthParams {
  apiKey: string
  secretKey: string
}

export interface AmplitudeSendEventParams extends AmplitudeApiKeyParams {
  userId?: string
  deviceId?: string
  eventType: string
  eventProperties?: string
  userProperties?: string
  time?: string
  sessionId?: string
  insertId?: string
  appVersion?: string
  platform?: string
  country?: string
  language?: string
  ip?: string
  price?: string
  quantity?: string
  revenue?: string
  productId?: string
  revenueType?: string
}

export interface AmplitudeSendEventResponse extends ToolResponse {
  output: {
    code: number
    eventsIngested: number
    payloadSizeBytes: number
    serverUploadTime: number
  }
}

export interface AmplitudeIdentifyUserParams extends AmplitudeApiKeyParams {
  userId?: string
  deviceId?: string
  userProperties: string
}

export interface AmplitudeIdentifyUserResponse extends ToolResponse {
  output: {
    code: number
    message: string | null
  }
}

export interface AmplitudeUserSearchParams extends AmplitudeBasicAuthParams {
  user: string
}

export interface AmplitudeUserSearchResponse extends ToolResponse {
  output: {
    matches: Array<{
      amplitudeId: number
      userId: string | null
    }>
    type: string | null
  }
}

export interface AmplitudeGetUserActivityParams extends AmplitudeBasicAuthParams {
  amplitudeId: string
  offset?: string
  limit?: string
  direction?: string
}

export interface AmplitudeGetUserActivityResponse extends ToolResponse {
  output: {
    events: Array<{
      eventType: string
      eventTime: string
      eventProperties: Record<string, unknown>
      userProperties: Record<string, unknown>
      sessionId: number | null
      platform: string | null
      country: string | null
      city: string | null
    }>
    userData: {
      userId: string | null
      canonicalAmplitudeId: number | null
      numEvents: number | null
      numSessions: number | null
      platform: string | null
      country: string | null
    } | null
  }
}

export interface AmplitudeExportEventsParams extends AmplitudeBasicAuthParams {
  start: string
  end: string
}

export interface AmplitudeExportEventsResponse extends ToolResponse {
  output: {
    exportedAt: string
    startDate: string
    endDate: string
    message: string
  }
}
