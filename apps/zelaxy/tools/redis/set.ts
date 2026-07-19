import type { ToolConfig } from '@/tools/types'
import type { RedisResponse, RedisSetParams } from './types'
import {
  buildConnection,
  connectionParams,
  REDIS_EXECUTE_URL,
  transformRedisResponse,
} from './utils'

export const redisSetTool: ToolConfig<RedisSetParams, RedisResponse> = {
  id: 'redis_set',
  name: 'Redis Set',
  description: 'Set the string value of a key',
  version: '1.0.0',
  params: {
    ...connectionParams,
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Key to write',
    },
    value: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Value to store',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: 'Redis reply (usually "OK")',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'SET',
      args: [params.key, params.value],
    }),
  },
  transformResponse: transformRedisResponse,
}
