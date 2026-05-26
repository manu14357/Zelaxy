import type { ToolConfig } from '@/tools/types'

export const cursorListAgentsTool: ToolConfig = {
  id: 'cursor_list_agents',
  name: 'Cursor List Agents',
  description: 'List all Cursor agents, with optional pagination and filtering.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Cursor API key',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of agents to return',
    },
    cursor: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination cursor from a previous response',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.cursor.com/v0/agents')
      if (params.limit) url.searchParams.set('limit', String(params.limit))
      if (params.cursor) url.searchParams.set('cursor', params.cursor)
      return url.toString()
    },
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
        agents: data.agents ?? [],
        nextCursor: data.nextCursor ?? null,
      },
    }
  },

  outputs: {
    agents: { type: 'json', description: 'Array of agents' },
    nextCursor: { type: 'string', description: 'Pagination cursor for next page', optional: true },
  },
}
