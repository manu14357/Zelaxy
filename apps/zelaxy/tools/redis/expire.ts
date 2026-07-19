import type { ToolConfig } from '@/tools/types'
import type { RedisExpireParams, RedisResponse } from './types'
import {
  buildConnection,
  connectionParams,
  REDIS_EXECUTE_URL,
  transformRedisResponse,
} from './utils'

export const redisExpireTool: ToolConfig<RedisExpireParams, RedisResponse> = {
  id: 'redis_expire',
  name: 'Redis Expire',
  description: 'Set a key to expire after a number of seconds',
  version: '1.0.0',
  params: {
    ...connectionParams,
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Key to expire',
    },
    seconds: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'Time-to-live in seconds',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: '1 if the timeout was set, 0 if the key does not exist',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'EXPIRE',
      args: [params.key, params.seconds],
    }),
  },
  transformResponse: transformRedisResponse,
}
