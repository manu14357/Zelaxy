import type { TemporalGenericResponse } from '@/tools/temporal/types'
import {
  buildTemporalHeaders,
  buildTemporalUrl,
  newRequestId,
  readTemporalResponse,
} from '@/tools/temporal/utils'
import type { ToolConfig } from '@/tools/types'

export const temporalTriggerScheduleTool: ToolConfig = {
  id: 'temporal_trigger_schedule',
  name: 'Temporal Trigger Schedule',
  description: 'Immediately trigger a Temporal schedule to take one action now.',
  version: '1.0.0',

  params: {
    serverUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Temporal server base URL',
    },
    namespace: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Temporal namespace',
    },
    apiKey: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Temporal API key (Bearer token)',
    },
    scheduleId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the schedule to trigger',
    },
    overlapPolicy: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Overlap policy for the triggered action (e.g., SCHEDULE_OVERLAP_POLICY_ALLOW_ALL)',
    },
  },

  request: {
    url: (params) =>
      buildTemporalUrl(
        params.serverUrl,
        `/namespaces/${encodeURIComponent(params.namespace)}/schedules/${encodeURIComponent(
          params.scheduleId
        )}/patch`
      ),
    method: 'POST',
    headers: (params) => buildTemporalHeaders(params),
    body: (params) => ({
      scheduleId: params.scheduleId,
      patch: {
        triggerImmediately: {
          ...(params.overlapPolicy ? { overlapPolicy: params.overlapPolicy } : {}),
        },
      },
      requestId: newRequestId(),
    }),
  },

  transformResponse: async (response, params): Promise<TemporalGenericResponse> => {
    await readTemporalResponse(response)
    return {
      success: true,
      output: {
        triggered: true,
        scheduleId: params?.scheduleId ?? '',
      },
    }
  },

  outputs: {
    triggered: { type: 'boolean', description: 'Whether the schedule action was triggered' },
    scheduleId: { type: 'string', description: 'ID of the triggered schedule' },
  },
}
