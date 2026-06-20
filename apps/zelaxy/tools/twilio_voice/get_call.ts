import type { GetCallParams, TwilioVoiceObjectResponse } from '@/tools/twilio_voice/types'
import type { ToolConfig } from '@/tools/types'

export const getCallTool: ToolConfig<GetCallParams, TwilioVoiceObjectResponse> = {
  id: 'twilio_voice_get_call',
  name: 'Twilio Get Call',
  description: 'Get details about a specific Twilio voice call',
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
    callSid: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'SID of the call to retrieve',
    },
  },

  request: {
    url: (params) =>
      `https://api.twilio.com/2010-04-01/Accounts/${params.accountSid}/Calls/${params.callSid}.json`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`${params.accountSid}:${params.authToken}`).toString('base64')}`,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { sid: data.sid } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Twilio call object' },
    metadata: {
      type: 'json',
      description: 'Call identifiers',
      properties: {
        sid: { type: 'string', description: 'Call SID' },
      },
    },
  },
}
