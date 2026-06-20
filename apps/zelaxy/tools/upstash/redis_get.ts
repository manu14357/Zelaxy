import type { ToolConfig } from '@/tools/types'
import type { UpstashRedisGetParams, UpstashResponse } from '@/tools/upstash/types'

export const redisGetTool: ToolConfig<UpstashRedisGetParams, UpstashResponse> = {
  id: 'upstash_redis_get',
  name: 'Upstash Redis GET',
  description: 'Get the value of a key from Upstash Redis',
  version: '1.0.0',

  params: {
    restUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Upstash Redis REST URL, e.g. https://xxx.upstash.io',
    },
    restToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Upstash Redis REST token',
    },
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The key to read',
    },
  },

  request: {
    url: (params) => `${params.restUrl}/get/${encodeURIComponent(params.key)}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.restToken}`,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { result: data.result } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Upstash response object ({ result })' },
    metadata: {
      type: 'json',
      description: 'Command metadata',
      properties: {
        result: { type: 'json', description: 'The value stored at the key' },
      },
    },
  },
}
