import type { ToolConfig } from '@/tools/types'
import type { RedisHsetParams, RedisResponse } from './types'
import {
  buildConnection,
  connectionParams,
  REDIS_EXECUTE_URL,
  transformRedisResponse,
} from './utils'

export const redisHsetTool: ToolConfig<RedisHsetParams, RedisResponse> = {
  id: 'redis_hset',
  name: 'Redis HSet',
  description: 'Set the value of a field in a hash',
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
    value: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Value to store in the field',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: '1 if a new field was created, 0 if an existing field was updated',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'HSET',
      args: [params.key, params.field, params.value],
    }),
  },
  transformResponse: transformRedisResponse,
}
