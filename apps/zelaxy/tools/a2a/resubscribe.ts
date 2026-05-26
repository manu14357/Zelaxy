import type { A2AResubscribeParams, A2AResubscribeResponse } from '@/tools/a2a/types'
import { A2A_OUTPUT_PROPERTIES } from '@/tools/a2a/types'
import type { ToolConfig } from '@/tools/types'

export const a2aResubscribeTool: ToolConfig<A2AResubscribeParams, A2AResubscribeResponse> = {
  id: 'a2a_resubscribe',
  name: 'A2A Resubscribe',
  description: 'Resubscribe to a streaming A2A task to retrieve new updates.',
  version: '1.0.0',

  params: {
    agentUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'The A2A agent endpoint URL',
    },
    taskId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Task ID to resubscribe to',
    },
    apiKey: {
      type: 'string',
      visibility: 'user-only',
      description: 'API key for authentication',
    },
  },

  request: {
    url: '/api/tools/a2a/resubscribe',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params: A2AResubscribeParams) => {
      const body: Record<string, string> = {
        agentUrl: params.agentUrl,
        taskId: params.taskId,
      }
      if (params.apiKey) body.apiKey = params.apiKey
      return body
    },
  },

  transformResponse: async (response: Response) => {
    const data = await response.json()
    return data
  },

  outputs: {
    taskId: A2A_OUTPUT_PROPERTIES.taskId,
    contextId: A2A_OUTPUT_PROPERTIES.contextId,
    state: A2A_OUTPUT_PROPERTIES.state,
    isRunning: A2A_OUTPUT_PROPERTIES.isRunning,
    artifacts: A2A_OUTPUT_PROPERTIES.artifacts,
    history: A2A_OUTPUT_PROPERTIES.history,
  },
}
