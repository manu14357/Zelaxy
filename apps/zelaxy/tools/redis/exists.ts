import type { ToolConfig } from '@/tools/types'
import type { RedisExistsParams, RedisResponse } from './types'
import {
  REDIS_EXECUTE_URL,
  buildConnection,
  connectionParams,
  transformRedisResponse,
} from './utils'

export const redisExistsTool: ToolConfig<RedisExistsParams, RedisResponse> = {
  id: 'redis_exists',
  name: 'Redis Exists',
  description: 'Check whether a key exists',
  version: '1.0.0',
  params: {
    ...connectionParams,
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Key to check',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: '1 if the key exists, 0 otherwise',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'EXISTS',
      args: [params.key],
    }),
  },
  transformResponse: transformRedisResponse,
}
