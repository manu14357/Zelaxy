import type { GongListCallsParams, GongListResponse } from '@/tools/gong/types'
import type { ToolConfig } from '@/tools/types'

export const listCallsTool: ToolConfig<GongListCallsParams, GongListResponse> = {
  id: 'gong_list_calls',
  name: 'Gong List Calls',
  description: 'Retrieve call data by date range from Gong',
  version: '1.0.0',

  params: {
    accessKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Gong API Access Key',
    },
    accessKeySecret: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Gong API Access Key Secret',
    },
    fromDateTime: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Start date/time in ISO-8601 format (e.g., 2024-01-01T00:00:00Z)',
    },
    toDateTime: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'End date/time in ISO-8601 format (e.g., 2024-01-31T23:59:59Z)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.gong.io/v2/calls')
      if (params.fromDateTime) url.searchParams.append('fromDateTime', params.fromDateTime)
      if (params.toDateTime) url.searchParams.append('toDateTime', params.toDateTime)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${params.accessKey}:${params.accessKeySecret}`).toString('base64')}`,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const calls = data.calls || []
    return {
      success: true,
      output: {
        data: calls,
        metadata: { count: calls.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Gong call objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
      },
    },
  },
}
