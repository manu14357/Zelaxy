import type {
  A2ASetPushNotificationParams,
  A2ASetPushNotificationResponse,
} from '@/tools/a2a/types'
import { A2A_OUTPUT_PROPERTIES } from '@/tools/a2a/types'
import type { ToolConfig } from '@/tools/types'

export const a2aSetPushNotificationTool: ToolConfig<
  A2ASetPushNotificationParams,
  A2ASetPushNotificationResponse
> = {
  id: 'a2a_set_push_notification',
  name: 'A2A Set Push Notification',
  description: 'Register a webhook URL to receive push notifications for A2A task updates.',
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
      description: 'Task ID to subscribe to',
    },
    webhookUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'HTTPS URL to receive task status notifications',
    },
    token: {
      type: 'string',
      visibility: 'user-only',
      description: 'Optional authentication token included in webhook requests',
    },
    apiKey: {
      type: 'string',
      visibility: 'user-only',
      description: 'API key for authentication',
    },
  },

  request: {
    url: '/api/tools/a2a/set-push-notification',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params: A2ASetPushNotificationParams) => {
      const body: Record<string, string> = {
        agentUrl: params.agentUrl,
        taskId: params.taskId,
        webhookUrl: params.webhookUrl,
      }
      if (params.token) body.token = params.token
      if (params.apiKey) body.apiKey = params.apiKey
      return body
    },
  },

  transformResponse: async (response: Response) => {
    const data = await response.json()
    return data
  },

  outputs: {
    url: A2A_OUTPUT_PROPERTIES.webhookUrl,
    token: A2A_OUTPUT_PROPERTIES.webhookToken,
    success: A2A_OUTPUT_PROPERTIES.success,
  },
}
