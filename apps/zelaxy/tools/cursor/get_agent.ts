import type { ToolConfig } from '@/tools/types'

export const cursorGetAgentTool: ToolConfig = {
  id: 'cursor_get_agent',
  name: 'Cursor Get Agent',
  description: 'Get the status and details of a Cursor agent by its ID.',
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
      description: 'Agent ID to retrieve',
    },
  },

  request: {
    url: (params) => `https://api.cursor.com/v0/agents/${params.agentId.trim()}`,
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
        name: data.name ?? null,
        status: data.status,
        source: data.source ?? null,
        target: data.target ?? null,
        summary: data.summary ?? null,
        createdAt: data.createdAt ?? null,
      },
    }
  },

  outputs: {
    id: { type: 'string', description: 'Agent ID' },
    name: { type: 'string', description: 'Agent name', optional: true },
    status: { type: 'string', description: 'Agent status' },
    source: { type: 'json', description: 'Source repository info', optional: true },
    target: { type: 'json', description: 'Target branch info', optional: true },
    summary: { type: 'string', description: 'Agent summary', optional: true },
    createdAt: { type: 'string', description: 'Creation timestamp', optional: true },
  },
}
