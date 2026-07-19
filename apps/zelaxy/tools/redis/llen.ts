import type { ToolConfig } from '@/tools/types'
import type { RedisLlenParams, RedisResponse } from './types'
import {
  REDIS_EXECUTE_URL,
  buildConnection,
  connectionParams,
  transformRedisResponse,
} from './utils'

export const redisLlenTool: ToolConfig<RedisLlenParams, RedisResponse> = {
  id: 'redis_llen',
  name: 'Redis LLen',
  description: 'Get the length of a list',
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
      description: 'Number of elements in the list',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'LLEN',
      args: [params.key],
    }),
  },
  transformResponse: transformRedisResponse,
}
