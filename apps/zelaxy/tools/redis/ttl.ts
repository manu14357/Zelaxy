import type { ToolConfig } from '@/tools/types'
import type { RedisResponse, RedisTtlParams } from './types'
import {
  buildConnection,
  connectionParams,
  REDIS_EXECUTE_URL,
  transformRedisResponse,
} from './utils'

export const redisTtlTool: ToolConfig<RedisTtlParams, RedisResponse> = {
  id: 'redis_ttl',
  name: 'Redis TTL',
  description: 'Get the remaining time-to-live of a key in seconds',
  version: '1.0.0',
  params: {
    ...connectionParams,
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Key to inspect',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: 'Remaining TTL in seconds (-1 no expiry, -2 key missing)',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'TTL',
      args: [params.key],
    }),
  },
  transformResponse: transformRedisResponse,
}
