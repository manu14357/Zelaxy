import type { ToolConfig } from '@/tools/types'
import type { UpstashRedisSetParams, UpstashResponse } from '@/tools/upstash/types'

export const redisSetTool: ToolConfig<UpstashRedisSetParams, UpstashResponse> = {
  id: 'upstash_redis_set',
  name: 'Upstash Redis SET',
  description: 'Set the value of a key in Upstash Redis',
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
      description: 'The key to write',
    },
    value: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The value to store',
    },
  },

  request: {
    url: (params) =>
      `${params.restUrl}/set/${encodeURIComponent(params.key)}/${encodeURIComponent(params.value)}`,
    method: 'POST',
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
        result: { type: 'json', description: 'The result of the SET command (usually "OK")' },
      },
    },
  },
}
