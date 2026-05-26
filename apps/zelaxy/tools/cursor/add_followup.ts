import type { ToolConfig } from '@/tools/types'

export const cursorAddFollowupTool: ToolConfig = {
  id: 'cursor_add_followup',
  name: 'Cursor Add Followup',
  description: 'Add a follow-up prompt to an existing Cursor agent conversation.',
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
      description: 'Agent ID to send follow-up to',
    },
    promptText: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The follow-up prompt text',
    },
  },

  request: {
    url: (params) => `https://api.cursor.com/v0/agents/${params.agentId.trim()}/followup`,
    method: 'POST',
    headers: (params) => ({
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${params.apiKey}:`).toString('base64')}`,
    }),
    body: (params) => ({
      prompt: { text: params.promptText },
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
      output: { id: data.id },
    }
  },

  outputs: {
    id: {
      type: 'string',
      description: 'Follow-up message ID',
    },
  },
}
