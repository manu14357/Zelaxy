import type {
  TriggerDevObjectResponse,
  TriggerDevTriggerTaskParams,
} from '@/tools/trigger_dev/types'
import type { ToolConfig } from '@/tools/types'

export const triggerTaskTool: ToolConfig<TriggerDevTriggerTaskParams, TriggerDevObjectResponse> = {
  id: 'trigger_dev_trigger_task',
  name: 'Trigger.dev Trigger Task',
  description: 'Trigger a Trigger.dev task by its identifier with an optional JSON payload',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Trigger.dev secret API key',
    },
    taskIdentifier: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Identifier of the task to trigger',
    },
    payload: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'JSON payload passed to the task run',
    },
    idempotencyKey: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Idempotency key that ensures the task is triggered only once per key',
    },
  },

  request: {
    url: (params) =>
      `https://api.trigger.dev/api/v1/tasks/${encodeURIComponent(params.taskIdentifier)}/trigger`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = {}
      if (params.payload) body.payload = params.payload
      if (params.idempotencyKey) body.options = { idempotencyKey: params.idempotencyKey }
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The triggered run object' },
    metadata: {
      type: 'json',
      description: 'Run identifiers',
      properties: {
        id: { type: 'string', description: 'ID of the run that was triggered' },
      },
    },
  },
}
