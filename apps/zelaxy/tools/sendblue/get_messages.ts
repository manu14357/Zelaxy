import type { GetMessagesParams, SendblueListResponse } from '@/tools/sendblue/types'
import type { ToolConfig } from '@/tools/types'

export const getMessagesTool: ToolConfig<GetMessagesParams, SendblueListResponse> = {
  id: 'sendblue_get_messages',
  name: 'Sendblue Get Messages',
  description: 'Retrieve messages from a Sendblue account',
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
  },

  request: {
    url: () => 'https://api.sendblue.co/api/accounts/messages',
    method: 'GET',
    headers: (params) => ({
      'sb-api-key-id': params.apiKeyId,
      'sb-api-secret-key': params.apiSecret,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const messages = Array.isArray(data) ? data : data.messages || data.data || []
    return {
      success: true,
      output: {
        data: messages,
        metadata: { count: messages.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Sendblue message objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of messages returned' },
      },
    },
  },
}
