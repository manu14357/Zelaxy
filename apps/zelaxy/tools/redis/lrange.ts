import type { ToolConfig } from '@/tools/types'
import type { RedisLrangeParams, RedisResponse } from './types'
import {
  buildConnection,
  connectionParams,
  REDIS_EXECUTE_URL,
  transformRedisResponse,
} from './utils'

export const redisLrangeTool: ToolConfig<RedisLrangeParams, RedisResponse> = {
  id: 'redis_lrange',
  name: 'Redis LRange',
  description: 'Get a range of elements from a list',
  version: '1.0.0',
  params: {
    ...connectionParams,
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'List key',
    },
    start: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start index (0-based, negatives count from the end)',
    },
    stop: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'Stop index (inclusive, -1 for the last element)',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: 'Array of elements in the requested range',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'LRANGE',
      args: [params.key, params.start, params.stop],
    }),
  },
  transformResponse: transformRedisResponse,
}
