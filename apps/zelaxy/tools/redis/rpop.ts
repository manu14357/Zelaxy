import type { ToolConfig } from '@/tools/types'
import type { RedisResponse, RedisRpopParams } from './types'
import {
  buildConnection,
  connectionParams,
  REDIS_EXECUTE_URL,
  transformRedisResponse,
} from './utils'

export const redisRpopTool: ToolConfig<RedisRpopParams, RedisResponse> = {
  id: 'redis_rpop',
  name: 'Redis RPop',
  description: 'Remove and return the last element of a list',
  version: '1.0.0',
  params: {
    ...connectionParams,
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'List key',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: 'The popped element (null if the list is empty)',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: 'RPOP',
      args: [params.key],
    }),
  },
  transformResponse: transformRedisResponse,
}
