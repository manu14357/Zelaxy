import type { ToolConfig } from '@/tools/types'
import type { RedisGetParams, RedisResponse } from './types'
import {
  buildConnection,
  connectionParams,
  REDIS_EXECUTE_URL,
  transformRedisResponse,
} from './utils'

export const redisGetTool: ToolConfig<RedisGetParams, RedisResponse> = {
  id: 'redis_get',
  name: 'Redis Get',
  description: 'Get the value of a string key',
  version: '1.0.0',
  params: {
    ...connectionParams,
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Key to read',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: 'The value stored at the key (null if it does not exist)',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'GET',
      args: [params.key],
    }),
  },
  transformResponse: transformRedisResponse,
}
