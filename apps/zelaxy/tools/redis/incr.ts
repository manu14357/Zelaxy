import type { ToolConfig } from '@/tools/types'
import type { RedisIncrParams, RedisResponse } from './types'
import {
  REDIS_EXECUTE_URL,
  buildConnection,
  connectionParams,
  transformRedisResponse,
} from './utils'

export const redisIncrTool: ToolConfig<RedisIncrParams, RedisResponse> = {
  id: 'redis_incr',
  name: 'Redis Incr',
  description: 'Increment the integer value of a key by one',
  version: '1.0.0',
  params: {
    ...connectionParams,
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Key to increment',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: 'The value after the increment',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'INCR',
      args: [params.key],
    }),
  },
  transformResponse: transformRedisResponse,
}
