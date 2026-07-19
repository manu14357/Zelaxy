import type { TemporalGenericResponse } from '@/tools/temporal/types'
import {
  buildTemporalHeaders,
  buildTemporalUrl,
  parseMaybeJson,
  readTemporalResponse,
} from '@/tools/temporal/utils'
import type { ToolConfig } from '@/tools/types'

export const temporalUpdateScheduleTool: ToolConfig = {
  id: 'temporal_update_schedule',
  name: 'Temporal Update Schedule',
  description: 'Replace the definition of an existing Temporal schedule.',
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
      description: 'ID of the schedule to update',
    },
    schedule: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Full replacement Schedule object as JSON',
    },
    conflictToken: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Conflict token from a prior describe for optimistic concurrency',
    },
  },

  request: {
    url: (params) =>
      buildTemporalUrl(
        params.serverUrl,
        `/namespaces/${encodeURIComponent(params.namespace)}/schedules/${encodeURIComponent(
          params.scheduleId
        )}/update`
      ),
    method: 'POST',
    headers: (params) => buildTemporalHeaders(params),
    body: (params) => {
      const body: Record<string, any> = {
        scheduleId: params.scheduleId,
        schedule: parseMaybeJson(params.schedule) ?? {},
      }
      if (params.conflictToken) body.conflictToken = params.conflictToken
      return body
    },
  },

  transformResponse: async (response, params): Promise<TemporalGenericResponse> => {
    await readTemporalResponse(response)
    return {
      success: true,
      output: {
        updated: true,
        scheduleId: params?.scheduleId ?? '',
      },
    }
  },

  outputs: {
    updated: { type: 'boolean', description: 'Whether the schedule was updated' },
    scheduleId: { type: 'string', description: 'ID of the updated schedule' },
  },
}
