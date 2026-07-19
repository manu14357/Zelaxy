import type { ToolConfig } from '@/tools/types'
import type { RedisHgetallParams, RedisResponse } from './types'
import {
  buildConnection,
  connectionParams,
  REDIS_EXECUTE_URL,
  transformRedisResponse,
} from './utils'

export const redisHgetallTool: ToolConfig<RedisHgetallParams, RedisResponse> = {
  id: 'redis_hgetall',
  name: 'Redis HGetAll',
  description: 'Get all fields and values of a hash',
  version: '1.0.0',
  params: {
    ...connectionParams,
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Hash key',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: 'Object of field/value pairs (empty object if missing)',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'HGETALL',
      args: [params.key],
    }),
  },
  transformResponse: transformRedisResponse,
}
