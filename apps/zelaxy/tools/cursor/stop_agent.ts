import type { ToolConfig } from '@/tools/types'

export const cursorStopAgentTool: ToolConfig = {
  id: 'cursor_stop_agent',
  name: 'Cursor Stop Agent',
  description: 'Stop a running Cursor agent.',
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
      description: 'Agent ID to stop',
    },
  },

  request: {
    url: (params) => `https://api.cursor.com/v0/agents/${params.agentId.trim()}/stop`,
    method: 'POST',
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
      output: { id: data.id },
    }
  },

  outputs: {
    id: { type: 'string', description: 'Agent ID that was stopped' },
  },
}
