import type { DropcontactBatchResponse, GetBatchParams } from '@/tools/dropcontact/types'
import type { ToolConfig } from '@/tools/types'

export const getBatchTool: ToolConfig<GetBatchParams, DropcontactBatchResponse> = {
  id: 'dropcontact_get_batch',
  name: 'Dropcontact Get Batch',
  description: 'Retrieve the result of a Dropcontact enrichment request by request_id',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Dropcontact API access token',
    },
    request_id: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Request ID returned by the enrich operation',
    },
  },

  request: {
    url: (params) => `https://api.dropcontact.com/batch/${params.request_id}`,
    method: 'GET',
    headers: (params) => ({
      'X-Access-Token': params.apiKey,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data: data.data || [],
        metadata: { request_id: data.request_id, ready: data.success ?? false },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of enriched contact objects' },
    metadata: {
      type: 'json',
      description: 'Batch result metadata',
      properties: {
        request_id: { type: 'string', description: 'The polled request ID' },
        ready: { type: 'boolean', description: 'Whether the enrichment result is ready' },
      },
    },
  },
}
