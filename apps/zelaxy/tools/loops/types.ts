import type { ToolResponse } from '@/tools/types'

export interface LoopsBaseParams {
  apiKey: string
}

export interface LoopsCreateContactParams extends LoopsBaseParams {
  email: string
  firstName?: string
  lastName?: string
}

export interface LoopsUpdateContactParams extends LoopsBaseParams {
  email: string
  firstName?: string
  lastName?: string
}

export interface LoopsSendEventParams extends LoopsBaseParams {
  email: string
  eventName: string
}

export interface LoopsSendTransactionalParams extends LoopsBaseParams {
  transactionalId: string
  email: string
}

export interface LoopsResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { success: boolean; id?: string }
  }
}
