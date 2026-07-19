import type { ToolConfig } from '@/tools/types'
import type { RedisResponse, RedisSetnxParams } from './types'
import {
  buildConnection,
  connectionParams,
  REDIS_EXECUTE_URL,
  transformRedisResponse,
} from './utils'

export const redisSetnxTool: ToolConfig<RedisSetnxParams, RedisResponse> = {
  id: 'redis_setnx',
  name: 'Redis SetNX',
  description: 'Set the value of a key only if it does not already exist',
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
      description: 'Value to store if the key is absent',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: '1 if the key was set, 0 if it already existed',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'SETNX',
      args: [params.key, params.value],
    }),
  },
  transformResponse: transformRedisResponse,
}
