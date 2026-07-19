import type { TemporalGenericResponse } from '@/tools/temporal/types'
import {
  buildTemporalHeaders,
  buildTemporalUrl,
  newRequestId,
  readTemporalResponse,
} from '@/tools/temporal/utils'
import type { ToolConfig } from '@/tools/types'

export const temporalUnpauseScheduleTool: ToolConfig = {
  id: 'temporal_unpause_schedule',
  name: 'Temporal Unpause Schedule',
  description: 'Unpause a Temporal schedule so it resumes taking scheduled actions.',
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
      description: 'ID of the schedule to unpause',
    },
    reason: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optional note explaining why the schedule was unpaused',
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
        unpause: params.reason || 'Unpaused via Zelaxy',
      },
      requestId: newRequestId(),
    }),
  },

  transformResponse: async (response, params): Promise<TemporalGenericResponse> => {
    await readTemporalResponse(response)
    return {
      success: true,
      output: {
        unpaused: true,
        scheduleId: params?.scheduleId ?? '',
      },
    }
  },

  outputs: {
    unpaused: { type: 'boolean', description: 'Whether the schedule was unpaused' },
    scheduleId: { type: 'string', description: 'ID of the unpaused schedule' },
  },
}
