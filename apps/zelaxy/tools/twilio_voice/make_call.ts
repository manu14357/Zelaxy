import type { MakeCallParams, TwilioVoiceObjectResponse } from '@/tools/twilio_voice/types'
import type { ToolConfig } from '@/tools/types'

export const makeCallTool: ToolConfig<MakeCallParams, TwilioVoiceObjectResponse> = {
  id: 'twilio_voice_make_call',
  name: 'Twilio Make Call',
  description: 'Initiate an outbound voice call with Twilio',
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
    To: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Phone number to call in E.164 format',
    },
    From: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Twilio phone number to call from in E.164 format',
    },
    Url: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'URL returning TwiML instructions for the call',
    },
  },

  request: {
    url: (params) => `https://api.twilio.com/2010-04-01/Accounts/${params.accountSid}/Calls.json`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`${params.accountSid}:${params.authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    }),
    body: (params) => {
      const form = new URLSearchParams()
      form.append('To', params.To)
      form.append('From', params.From)
      form.append('Url', params.Url)
      return { body: form.toString() }
    },
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
