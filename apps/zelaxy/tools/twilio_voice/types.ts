import type { ToolResponse } from '@/tools/types'

export interface TwilioVoiceBaseParams {
  accountSid: string
  authToken: string
}

export interface MakeCallParams extends TwilioVoiceBaseParams {
  To: string
  From: string
  Url: string
}

export interface ListCallsParams extends TwilioVoiceBaseParams {
  limit?: number
}

export interface GetCallParams extends TwilioVoiceBaseParams {
  callSid: string
}

export interface TwilioVoiceObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { sid: string }
  }
}

export interface TwilioVoiceListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type TwilioVoiceResponse = TwilioVoiceObjectResponse | TwilioVoiceListResponse
