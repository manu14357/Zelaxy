import type { ToolConfig } from '@/tools/types'

export const cursorGetConversationTool: ToolConfig = {
  id: 'cursor_get_conversation',
  name: 'Cursor Get Conversation',
  description: 'Get the conversation history for a Cursor agent.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Cursor API key',
    },
    agentId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Agent ID to retrieve conversation for',
    },
  },

  request: {
    url: (params) => `https://api.cursor.com/v0/agents/${params.agentId.trim()}/conversation`,
    method: 'GET',
    headers: (params) => ({
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${params.apiKey}:`).toString('base64')}`,
    }),
  },

  transformResponse: async (response: Response) => {
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error((data as { message?: string }).message || `HTTP ${response.status}`)
    }
    const data = await response.json()
    return {
      success: true,
      output: {
        id: data.id,
        messages: data.messages ?? [],
      },
    }
  },

  outputs: {
    id: { type: 'string', description: 'Conversation ID' },
    messages: { type: 'json', description: 'Array of conversation messages' },
  },
}
