import type { LoopsResponse, LoopsSendEventParams } from '@/tools/loops/types'
import type { ToolConfig } from '@/tools/types'

export const sendEventTool: ToolConfig<LoopsSendEventParams, LoopsResponse> = {
  id: 'loops_send_event',
  name: 'Loops Send Event',
  description: 'Send an event to Loops to trigger automated email sequences',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Loops API key',
    },
    email: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The email address of the contact',
    },
    eventName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The name of the event to trigger',
    },
  },

  request: {
    url: () => 'https://app.loops.so/api/v1/events/send',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({ email: params.email, eventName: params.eventName }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { success: data.success ?? true } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Loops API response' },
    metadata: {
      type: 'json',
      description: 'Event result',
      properties: {
        success: { type: 'boolean', description: 'Whether the event was sent' },
      },
    },
  },
}
