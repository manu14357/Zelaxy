import type { DelayToolParams, DelayToolResponse } from '@/tools/delay/types'
import type { ToolConfig } from '@/tools/types'

export const delayTool: ToolConfig<DelayToolParams, DelayToolResponse> = {
  id: 'delay_wait',
  name: 'Wait / Delay',
  description: 'Pause workflow execution for a specified duration.',
  version: '1.0.0',

  params: {
    duration: {
      type: 'number',
      required: true,
      visibility: 'user-only',
      description: 'How long to wait.',
    },
    unit: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      default: 'seconds',
      description: 'Time unit for the delay (seconds, minutes, or hours).',
    },
  },

  request: {
    url: '/api/tools/delay',
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params: DelayToolParams) => ({
      duration: params.duration,
      unit: params.unit,
    }),
  },

  transformResponse: async (response: Response): Promise<DelayToolResponse> => {
    const data = await response.json()
    return data
  },

  outputs: {
    delayed: {
      type: 'boolean',
      description: 'Whether the delay completed successfully',
    },
    duration: {
      type: 'number',
      description: 'The requested delay duration',
    },
    unit: {
      type: 'string',
      description: 'The time unit used',
    },
    delayMs: {
      type: 'number',
      description: 'Actual delay in milliseconds',
    },
    startedAt: {
      type: 'string',
      description: 'ISO timestamp when the delay started',
    },
    completedAt: {
      type: 'string',
      description: 'ISO timestamp when the delay completed',
    },
  },
}
