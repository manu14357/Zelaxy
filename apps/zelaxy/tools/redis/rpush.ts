import type { ToolConfig } from '@/tools/types'
import type { RedisResponse, RedisRpushParams } from './types'
import {
  buildConnection,
  connectionParams,
  REDIS_EXECUTE_URL,
  transformRedisResponse,
} from './utils'

export const redisRpushTool: ToolConfig<RedisRpushParams, RedisResponse> = {
  id: 'redis_rpush',
  name: 'Redis RPush',
  description: 'Append a value to the tail of a list',
  version: '1.0.0',
  params: {
    ...connectionParams,
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'List key',
    },
    value: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Value to append',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: 'Length of the list after the push',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'RPUSH',
      args: [params.key, params.value],
    }),
  },
  transformResponse: transformRedisResponse,
}
