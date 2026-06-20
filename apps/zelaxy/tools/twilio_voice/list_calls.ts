import type { ListCallsParams, TwilioVoiceListResponse } from '@/tools/twilio_voice/types'
import type { ToolConfig } from '@/tools/types'

export const listCallsTool: ToolConfig<ListCallsParams, TwilioVoiceListResponse> = {
  id: 'twilio_voice_list_calls',
  name: 'Twilio List Calls',
  description: 'List voice calls for a Twilio account',
  version: '1.0.0',

  params: {
    accountSid: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Twilio Account SID',
    },
    authToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Twilio Auth Token',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of calls to return',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(
        `https://api.twilio.com/2010-04-01/Accounts/${params.accountSid}/Calls.json`
      )
      if (params.limit) url.searchParams.append('PageSize', String(params.limit))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`${params.accountSid}:${params.authToken}`).toString('base64')}`,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const calls = data.calls || []
    return {
      success: true,
      output: {
        data: calls,
        metadata: { count: calls.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Twilio call objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of calls returned' },
      },
    },
  },
}
