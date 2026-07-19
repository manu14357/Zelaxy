import type { ToolConfig } from '@/tools/types'
import type { RedisHdelParams, RedisResponse } from './types'
import {
  buildConnection,
  connectionParams,
  REDIS_EXECUTE_URL,
  transformRedisResponse,
} from './utils'

export const redisHdelTool: ToolConfig<RedisHdelParams, RedisResponse> = {
  id: 'redis_hdel',
  name: 'Redis HDel',
  description: 'Delete a field from a hash',
  version: '1.0.0',
  params: {
    ...connectionParams,
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Hash key',
    },
    field: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Field to delete',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: 'Number of fields removed (0 or 1)',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'HDEL',
      args: [params.key, params.field],
    }),
  },
  transformResponse: transformRedisResponse,
}
