import type { ParameterVisibility } from '@/tools/types'
import type { RedisConnectionParams, RedisResponse } from './types'

/**
 * Internal Zelaxy route that runs Redis commands via ioredis.
 * Starts with /api/ so the tool runner dispatches it internally.
 */
export const REDIS_EXECUTE_URL = '/api/tools/redis/execute'

type ParamDef = {
  type: string
  required?: boolean
  visibility?: ParameterVisibility
  default?: any
  description?: string
}

/**
 * Connection parameter definitions shared by every Redis tool.
 */
export const connectionParams: Record<string, ParamDef> = {
  host: {
    type: 'string',
    required: true,
    visibility: 'user-only',
    description: 'Redis host or IP address',
  },
  port: {
    type: 'number',
    required: false,
    visibility: 'user-only',
    default: 6379,
    description: 'Redis port (default: 6379)',
  },
  password: {
    type: 'string',
    required: false,
    visibility: 'user-only',
    description: 'Redis password (leave empty if none)',
  },
  username: {
    type: 'string',
    required: false,
    visibility: 'user-only',
    description: 'Redis ACL username (Redis 6+, optional)',
  },
  db: {
    type: 'number',
    required: false,
    visibility: 'user-only',
    default: 0,
    description: 'Redis database index (default: 0)',
  },
  tls: {
    type: 'boolean',
    required: false,
    visibility: 'user-only',
    default: false,
    description: 'Enable TLS/SSL connection',
  },
}

/**
 * Build the connection payload sent to the internal route.
 */
export function buildConnection(params: RedisConnectionParams) {
  const portValue =
    params.port === undefined || (params.port as unknown) === '' ? 6379 : params.port
  const dbValue = params.db === undefined || (params.db as unknown) === '' ? 0 : params.db

  return {
    host: params.host,
    port: Number(portValue),
    password: params.password ? params.password : undefined,
    username: params.username ? params.username : undefined,
    db: Number(dbValue),
    tls: params.tls ?? false,
  }
}

/**
 * Shared response transformer for every Redis tool.
 */
export async function transformRedisResponse(response: Response): Promise<RedisResponse> {
  let data: any = {}
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok || !data?.success) {
    return {
      success: false,
      output: { result: null },
      error: data?.error || `HTTP ${response.status}: ${response.statusText}`,
    }
  }

  return {
    success: true,
    output: { result: data.result },
  }
}
