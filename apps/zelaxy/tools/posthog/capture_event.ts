import type { CaptureEventParams, PostHogObjectResponse } from '@/tools/posthog/types'
import type { ToolConfig } from '@/tools/types'

export const captureEventTool: ToolConfig<CaptureEventParams, PostHogObjectResponse> = {
  id: 'posthog_capture_event',
  name: 'PostHog Capture Event',
  description: 'Capture a single event in PostHog',
  version: '1.0.0',

  params: {
    host: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'PostHog host (e.g. https://us.posthog.com)',
    },
    projectApiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'PostHog project API key (public ingestion token)',
    },
    event: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Name of the event to capture',
    },
    distinct_id: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Unique identifier for the user or device',
    },
    properties: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Set of key-value properties to attach to the event',
    },
  },

  request: {
    url: (params) => `${params.host.replace(/\/$/, '')}/capture/`,
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = {
        api_key: params.projectApiKey,
        event: params.event,
        distinct_id: params.distinct_id,
      }
      if (params.properties) body.properties = params.properties
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json().catch(() => ({}))
    return {
      success: true,
      output: { data, metadata: { status: data?.status ?? 'ok' } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The PostHog capture response' },
    metadata: {
      type: 'json',
      description: 'Capture metadata',
      properties: {
        status: { type: 'string', description: 'Capture status' },
      },
    },
  },
}
