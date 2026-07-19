import type { TemporalGenericResponse } from '@/tools/temporal/types'
import {
  buildTemporalHeaders,
  buildTemporalUrl,
  newRequestId,
  readTemporalResponse,
} from '@/tools/temporal/utils'
import type { ToolConfig } from '@/tools/types'

export const temporalPauseScheduleTool: ToolConfig = {
  id: 'temporal_pause_schedule',
  name: 'Temporal Pause Schedule',
  description: 'Pause a Temporal schedule so it stops taking scheduled actions.',
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
      description: 'ID of the schedule to pause',
    },
    reason: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optional note explaining why the schedule was paused',
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
        pause: params.reason || 'Paused via Zelaxy',
      },
      requestId: newRequestId(),
    }),
  },

  transformResponse: async (response, params): Promise<TemporalGenericResponse> => {
    await readTemporalResponse(response)
    return {
      success: true,
      output: {
        paused: true,
        scheduleId: params?.scheduleId ?? '',
      },
    }
  },

  outputs: {
    paused: { type: 'boolean', description: 'Whether the schedule was paused' },
    scheduleId: { type: 'string', description: 'ID of the paused schedule' },
  },
}
