import type { ToolConfig } from '@/tools/types'
import type { RedisIncrbyParams, RedisResponse } from './types'
import {
  REDIS_EXECUTE_URL,
  buildConnection,
  connectionParams,
  transformRedisResponse,
} from './utils'

export const redisIncrbyTool: ToolConfig<RedisIncrbyParams, RedisResponse> = {
  id: 'redis_incrby',
  name: 'Redis IncrBy',
  description: 'Increment the integer value of a key by a given amount',
  version: '1.0.0',
  params: {
    ...connectionParams,
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Key to increment',
    },
    increment: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'Amount to add (can be negative)',
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
      command: 'INCRBY',
      args: [params.key, params.increment],
    }),
  },
  transformResponse: transformRedisResponse,
}
