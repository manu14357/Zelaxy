import type { ToolConfig } from '@/tools/types'
import type { RedisKeysParams, RedisResponse } from './types'
import {
  buildConnection,
  connectionParams,
  REDIS_EXECUTE_URL,
  transformRedisResponse,
} from './utils'

export const redisKeysTool: ToolConfig<RedisKeysParams, RedisResponse> = {
  id: 'redis_keys',
  name: 'Redis Keys',
  description: 'Find all keys matching a glob-style pattern',
  version: '1.0.0',
  params: {
    ...connectionParams,
    pattern: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Glob pattern to match (e.g. user:* or *)',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: 'Array of matching keys',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'KEYS',
      args: [params.pattern],
    }),
  },
  transformResponse: transformRedisResponse,
}
