import type { ToolConfig } from '@/tools/types'
import type { RedisCommandParams, RedisResponse } from './types'
import {
  REDIS_EXECUTE_URL,
  buildConnection,
  connectionParams,
  transformRedisResponse,
} from './utils'

export const redisCommandTool: ToolConfig<RedisCommandParams, RedisResponse> = {
  id: 'redis_command',
  name: 'Redis Command',
  description: 'Run an arbitrary Redis command with a list of arguments',
  version: '1.0.0',
  params: {
    ...connectionParams,
    command: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Redis command name (e.g. GETRANGE, SADD, ZADD)',
    },
    arguments: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Array of command arguments',
    },
  },
  outputs: {
    result: {
      type: 'json',
      description: 'Raw reply from the Redis command',
    },
  },
  request: {
    url: REDIS_EXECUTE_URL,
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      connection: buildConnection(params),
      command: params.command,
      args: Array.isArray(params.arguments) ? params.arguments : [],
    }),
  },
  transformResponse: transformRedisResponse,
}
