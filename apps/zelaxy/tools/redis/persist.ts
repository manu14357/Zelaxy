import type { ToolConfig } from '@/tools/types'
import type { RedisPersistParams, RedisResponse } from './types'
import {
  buildConnection,
  connectionParams,
  REDIS_EXECUTE_URL,
  transformRedisResponse,
} from './utils'

export const redisPersistTool: ToolConfig<RedisPersistParams, RedisResponse> = {
  id: 'redis_persist',
  name: 'Redis Persist',
  description: 'Remove the expiration from a key',
  version: '1.0.0',
  params: {
    ...connectionParams,
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Key to persist',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: '1 if the timeout was removed, 0 otherwise',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'PERSIST',
      args: [params.key],
    }),
  },
  transformResponse: transformRedisResponse,
}
