import type { ToolConfig } from '@/tools/types'

export const cursorLaunchAgentTool: ToolConfig = {
  id: 'cursor_launch_agent',
  name: 'Cursor Launch Agent',
  description: 'Launch a new AI coding agent in Cursor with a prompt and repository context.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Cursor API key',
    },
    repository: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Repository slug (e.g., org/repo)',
    },
    ref: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Branch or commit ref (e.g., main)',
    },
    promptText: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The prompt text for the agent',
    },
    model: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Model to use (e.g., claude-4-5)',
    },
  },

  request: {
    url: 'https://api.cursor.com/v0/agents',
    method: 'POST',
    headers: (params) => ({
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${params.apiKey}:`).toString('base64')}`,
    }),
    body: (params) => {
      const body: Record<string, unknown> = {
        source: {
          repository: params.repository,
          ...(params.ref ? { ref: params.ref } : {}),
        },
        prompt: { text: params.promptText },
      }
      if (params.model) body.model = params.model
      return body
    },
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
        url: `https://cursor.com/agents?selectedBcId=${data.id}`,
      },
    }
  },

  outputs: {
    id: {
      type: 'string',
      description: 'Agent ID',
    },
    url: {
      type: 'string',
      description: 'URL to view the agent in Cursor',
    },
  },
}
