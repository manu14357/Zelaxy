import type { ToolConfig } from '@/tools/types'
import type { RedisHgetParams, RedisResponse } from './types'
import {
  buildConnection,
  connectionParams,
  REDIS_EXECUTE_URL,
  transformRedisResponse,
} from './utils'

export const redisHgetTool: ToolConfig<RedisHgetParams, RedisResponse> = {
  id: 'redis_hget',
  name: 'Redis HGet',
  description: 'Get the value of a field in a hash',
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
      description: 'Field within the hash',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: 'The field value (null if the field or hash is missing)',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'HGET',
      args: [params.key, params.field],
    }),
  },
  transformResponse: transformRedisResponse,
}
