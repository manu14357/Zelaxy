import type { ToolResponse } from '@/tools/types'

/**
 * Connection details shared by every Redis operation.
 * These are forwarded to the internal /api/tools/redis/execute route,
 * which opens a single ioredis connection per request.
 */
export interface RedisConnectionParams {
  host: string
  port?: number
  password?: string
  username?: string
  db?: number
  tls?: boolean
}

// String / key operations
export interface RedisGetParams extends RedisConnectionParams {
  key: string
}

export interface RedisSetParams extends RedisConnectionParams {
  key: string
  value: string
}

export interface RedisSetnxParams extends RedisConnectionParams {
  key: string
  value: string
}

export interface RedisDeleteParams extends RedisConnectionParams {
  key: string
}

export interface RedisExistsParams extends RedisConnectionParams {
  key: string
}

export interface RedisExpireParams extends RedisConnectionParams {
  key: string
  seconds: number
}

export interface RedisTtlParams extends RedisConnectionParams {
  key: string
}

export interface RedisPersistParams extends RedisConnectionParams {
  key: string
}

export interface RedisIncrParams extends RedisConnectionParams {
  key: string
}

export interface RedisIncrbyParams extends RedisConnectionParams {
  key: string
  increment: number
}

export interface RedisKeysParams extends RedisConnectionParams {
  pattern: string
}

// Hash operations
export interface RedisHgetParams extends RedisConnectionParams {
  key: string
  field: string
}

export interface RedisHsetParams extends RedisConnectionParams {
  key: string
  field: string
  value: string
}

export interface RedisHdelParams extends RedisConnectionParams {
  key: string
  field: string
}

export interface RedisHgetallParams extends RedisConnectionParams {
  key: string
}

// List operations
export interface RedisLlenParams extends RedisConnectionParams {
  key: string
}

export interface RedisLpushParams extends RedisConnectionParams {
  key: string
  value: string
}

export interface RedisRpushParams extends RedisConnectionParams {
  key: string
  value: string
}

export interface RedisLpopParams extends RedisConnectionParams {
  key: string
}

export interface RedisRpopParams extends RedisConnectionParams {
  key: string
}

export interface RedisLrangeParams extends RedisConnectionParams {
  key: string
  start: number
  stop: number
}

// Raw command
export interface RedisCommandParams extends RedisConnectionParams {
  command: string
  arguments?: Array<string | number>
}

export interface RedisResponse extends ToolResponse {
  output: {
    result: any
  }
}
