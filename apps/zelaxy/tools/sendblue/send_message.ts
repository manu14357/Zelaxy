import type { SendblueObjectResponse, SendMessageParams } from '@/tools/sendblue/types'
import type { ToolConfig } from '@/tools/types'

export const sendMessageTool: ToolConfig<SendMessageParams, SendblueObjectResponse> = {
  id: 'sendblue_send_message',
  name: 'Sendblue Send Message',
  description: 'Send an iMessage or SMS via Sendblue',
  version: '1.0.0',

  params: {
    apiKeyId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Sendblue API key ID',
    },
    apiSecret: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Sendblue API secret key',
    },
    number: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Recipient phone number in E.164 format (e.g. +19998887777)',
    },
    content: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Message text content',
    },
  },

  request: {
    url: () => 'https://api.sendblue.co/api/send-message',
    method: 'POST',
    headers: (params) => ({
      'sb-api-key-id': params.apiKeyId,
      'sb-api-secret-key': params.apiSecret,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      number: params.number,
      content: params.content,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { status: data.status } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Sendblue message object' },
    metadata: {
      type: 'json',
      description: 'Message metadata',
      properties: {
        status: { type: 'string', description: 'Message status' },
      },
    },
  },
}
