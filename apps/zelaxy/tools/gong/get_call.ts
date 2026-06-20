import type { GongGetCallParams, GongObjectResponse } from '@/tools/gong/types'
import type { ToolConfig } from '@/tools/types'

export const getCallTool: ToolConfig<GongGetCallParams, GongObjectResponse> = {
  id: 'gong_get_call',
  name: 'Gong Get Call',
  description: 'Retrieve detailed data for a specific call from Gong',
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
    callId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The Gong call ID to retrieve',
    },
  },

  request: {
    url: (params) => `https://api.gong.io/v2/calls/${encodeURIComponent(params.callId)}`,
    method: 'GET',
    headers: (params) => ({
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${params.accessKey}:${params.accessKeySecret}`).toString('base64')}`,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const call = data.call ?? data
    return {
      success: true,
      output: { data: call, metadata: { id: call.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Gong call object' },
    metadata: {
      type: 'json',
      description: 'Call identifiers',
      properties: {
        id: { type: 'string', description: 'Call ID' },
      },
    },
  },
}
