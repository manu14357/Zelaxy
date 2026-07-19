import type { ToolConfig } from '@/tools/types'
import type { RedisLpushParams, RedisResponse } from './types'
import {
  REDIS_EXECUTE_URL,
  buildConnection,
  connectionParams,
  transformRedisResponse,
} from './utils'

export const redisLpushTool: ToolConfig<RedisLpushParams, RedisResponse> = {
  id: 'redis_lpush',
  name: 'Redis LPush',
  description: 'Prepend a value to the head of a list',
  version: '1.0.0',
  params: {
    ...connectionParams,
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'List key',
    },
    value: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Value to prepend',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: 'Length of the list after the push',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'LPUSH',
      args: [params.key, params.value],
    }),
  },
  transformResponse: transformRedisResponse,
}
