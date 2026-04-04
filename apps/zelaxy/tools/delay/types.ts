import type { ToolResponse } from '@/tools/types'

export interface DelayToolParams {
  duration: number
  unit: 'seconds' | 'minutes' | 'hours'
}

export interface DelayToolResponse extends ToolResponse {
  output: {
    delayed: boolean
    duration: number
    unit: string
    delayMs: number
    startedAt: string
    completedAt: string
  }
}
