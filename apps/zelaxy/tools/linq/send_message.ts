import type { LinqObjectResponse, LinqSendMessageParams } from '@/tools/linq/types'
import type { ToolConfig } from '@/tools/types'

export const sendMessageTool: ToolConfig<LinqSendMessageParams, LinqObjectResponse> = {
  id: 'linq_send_message',
  name: 'Linq Send Message',
  description: 'Send a message to an existing Linq chat, with optional media or link',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Linq API key',
    },
    chatId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The unique identifier of the chat',
    },
    text: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Text content of the message',
    },
    mediaUrl: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Publicly accessible HTTPS URL of an image, video, or file to attach',
    },
    linkUrl: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'URL to send as a rich link preview (sent as its own message)',
    },
  },

  request: {
    url: (params) =>
      `https://api.linqapp.com/api/partner/v3/chats/${encodeURIComponent(params.chatId.trim())}/messages`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const parts: Array<Record<string, any>> = []
      if (params.linkUrl) {
        parts.push({ type: 'link', value: params.linkUrl })
      } else {
        if (params.text) parts.push({ type: 'text', value: params.text })
        if (params.mediaUrl) parts.push({ type: 'media', url: params.mediaUrl })
      }
      return { message: { parts } }
    },
  },

  transformResponse: async (response) => {
    const json = await response.json()
    const message = json.message ?? json
    return {
      success: true,
      output: { data: message, metadata: { id: message?.id ?? null } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The sent Linq message object with parts' },
    metadata: {
      type: 'json',
      description: 'Message identifiers',
      properties: {
        id: { type: 'string', description: 'Sent message ID' },
      },
    },
  },
}
