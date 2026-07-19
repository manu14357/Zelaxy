import type { ToolConfig } from '@/tools/types'
import type { RedisLpopParams, RedisResponse } from './types'
import {
  REDIS_EXECUTE_URL,
  buildConnection,
  connectionParams,
  transformRedisResponse,
} from './utils'

export const redisLpopTool: ToolConfig<RedisLpopParams, RedisResponse> = {
  id: 'redis_lpop',
  name: 'Redis LPop',
  description: 'Remove and return the first element of a list',
  version: '1.0.0',
  params: {
    ...connectionParams,
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'List key',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: 'The popped element (null if the list is empty)',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'LPOP',
      args: [params.key],
    }),
  },
  transformResponse: transformRedisResponse,
}
