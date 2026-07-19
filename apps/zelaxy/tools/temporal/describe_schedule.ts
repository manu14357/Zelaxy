import type { TemporalGenericResponse } from '@/tools/temporal/types'
import {
  buildTemporalHeaders,
  buildTemporalUrl,
  readTemporalResponse,
} from '@/tools/temporal/utils'
import type { ToolConfig } from '@/tools/types'

export const temporalDescribeScheduleTool: ToolConfig = {
  id: 'temporal_describe_schedule',
  name: 'Temporal Describe Schedule',
  description: 'Fetch the configuration and state of a Temporal schedule.',
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
      description: 'ID of the schedule to describe',
    },
  },

  request: {
    url: (params) =>
      buildTemporalUrl(
        params.serverUrl,
        `/namespaces/${encodeURIComponent(params.namespace)}/schedules/${encodeURIComponent(
          params.scheduleId
        )}`
      ),
    method: 'GET',
    headers: (params) => buildTemporalHeaders(params),
  },

  transformResponse: async (response): Promise<TemporalGenericResponse> => {
    const data = await readTemporalResponse(response)
    return {
      success: true,
      output: {
        schedule: data?.schedule ?? null,
        info: data?.info ?? null,
        memo: data?.memo ?? null,
        searchAttributes: data?.searchAttributes ?? null,
        conflictToken: data?.conflictToken ?? null,
      },
    }
  },

  outputs: {
    schedule: { type: 'json', description: 'The schedule spec, action, policies and state' },
    info: { type: 'json', description: 'Runtime info: recent/future action times, counts' },
    memo: { type: 'json', description: 'Schedule memo' },
    searchAttributes: { type: 'json', description: 'Schedule search attributes' },
    conflictToken: { type: 'string', description: 'Optimistic-concurrency conflict token' },
  },
}
