import type { ToolConfig } from '@/tools/types'
import type { RedisDeleteParams, RedisResponse } from './types'
import {
  REDIS_EXECUTE_URL,
  buildConnection,
  connectionParams,
  transformRedisResponse,
} from './utils'

export const redisDeleteTool: ToolConfig<RedisDeleteParams, RedisResponse> = {
  id: 'redis_delete',
  name: 'Redis Delete',
  description: 'Delete a key',
  version: '1.0.0',
  params: {
    ...connectionParams,
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Key to delete',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: 'Number of keys removed (0 or 1)',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'DEL',
      args: [params.key],
    }),
  },
  transformResponse: transformRedisResponse,
}
