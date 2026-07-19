import { RedisIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { RedisResponse } from '@/tools/redis/types'

const OPERATION_TO_TOOL: Record<string, string> = {
  get: 'redis_get',
  set: 'redis_set',
  setnx: 'redis_setnx',
  delete: 'redis_delete',
  exists: 'redis_exists',
  expire: 'redis_expire',
  ttl: 'redis_ttl',
  persist: 'redis_persist',
  incr: 'redis_incr',
  incrby: 'redis_incrby',
  keys: 'redis_keys',
  hget: 'redis_hget',
  hset: 'redis_hset',
  hdel: 'redis_hdel',
  hgetall: 'redis_hgetall',
  llen: 'redis_llen',
  lpush: 'redis_lpush',
  rpush: 'redis_rpush',
  lpop: 'redis_lpop',
  rpop: 'redis_rpop',
  lrange: 'redis_lrange',
  command: 'redis_command',
}

// Operations that take a single primary key argument.
const KEY_OPERATIONS = [
  'get',
  'set',
  'setnx',
  'delete',
  'exists',
  'expire',
  'ttl',
  'persist',
  'incr',
  'incrby',
  'hget',
  'hset',
  'hdel',
  'hgetall',
  'llen',
  'lpush',
  'rpush',
  'lpop',
  'rpop',
  'lrange',
]

export const RedisBlock: BlockConfig<RedisResponse> = {
  type: 'redis',
  name: 'Redis',
  description: 'Cache and manipulate Redis data structures',
  longDescription:
    'Connect to a Redis server to read and write strings, hashes, and lists, manage key expiration, run counters, and execute arbitrary Redis commands. Supports password/ACL auth, database selection, and TLS connections.',
  category: 'tools',
  docsLink: '#',
  bgColor: '#DC382D',
  icon: RedisIcon,
  subBlocks: [
    {
      id: 'host',
      title: 'Host',
      type: 'short-input',
      layout: 'full',
      placeholder: 'localhost or redis.example.com',
      required: true,
      description: 'Redis host or IP address',
    },
    {
      id: 'port',
      title: 'Port',
      type: 'short-input',
      layout: 'full',
      placeholder: '6379',
      value: () => '6379',
      description: 'Redis port (default: 6379)',
    },
    {
      id: 'username',
      title: 'Username',
      type: 'short-input',
      layout: 'full',
      placeholder: 'ACL username (Redis 6+, optional)',
      description: 'Redis ACL username (optional)',
    },
    {
      id: 'password',
      title: 'Password',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter password (leave empty if none)',
      password: true,
      description: 'Redis password (optional)',
    },
    {
      id: 'db',
      title: 'Database Index',
      type: 'short-input',
      layout: 'full',
      placeholder: '0',
      value: () => '0',
      description: 'Redis database index (default: 0)',
    },
    {
      id: 'tls',
      title: 'Enable TLS',
      type: 'switch',
      layout: 'full',
      description: 'Use a TLS/SSL encrypted connection',
    },
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      required: true,
      options: [
        { label: 'Get', id: 'get' },
        { label: 'Set', id: 'set' },
        { label: 'Set If Not Exists (SETNX)', id: 'setnx' },
        { label: 'Delete', id: 'delete' },
        { label: 'Exists', id: 'exists' },
        { label: 'Expire', id: 'expire' },
        { label: 'TTL', id: 'ttl' },
        { label: 'Persist', id: 'persist' },
        { label: 'Increment (INCR)', id: 'incr' },
        { label: 'Increment By (INCRBY)', id: 'incrby' },
        { label: 'Keys', id: 'keys' },
        { label: 'Hash Get (HGET)', id: 'hget' },
        { label: 'Hash Set (HSET)', id: 'hset' },
        { label: 'Hash Delete (HDEL)', id: 'hdel' },
        { label: 'Hash Get All (HGETALL)', id: 'hgetall' },
        { label: 'List Length (LLEN)', id: 'llen' },
        { label: 'List Push Left (LPUSH)', id: 'lpush' },
        { label: 'List Push Right (RPUSH)', id: 'rpush' },
        { label: 'List Pop Left (LPOP)', id: 'lpop' },
        { label: 'List Pop Right (RPOP)', id: 'rpop' },
        { label: 'List Range (LRANGE)', id: 'lrange' },
        { label: 'Raw Command', id: 'command' },
      ],
      value: () => 'get',
    },
    {
      id: 'key',
      title: 'Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'my:key',
      condition: { field: 'operation', value: KEY_OPERATIONS },
      required: true,
      description: 'The Redis key to operate on',
    },
    {
      id: 'pattern',
      title: 'Pattern',
      type: 'short-input',
      layout: 'full',
      placeholder: 'user:* or *',
      condition: { field: 'operation', value: 'keys' },
      required: true,
      description: 'Glob-style pattern for matching keys',
    },
    {
      id: 'field',
      title: 'Field',
      type: 'short-input',
      layout: 'full',
      placeholder: 'field name',
      condition: { field: 'operation', value: ['hget', 'hset', 'hdel'] },
      required: true,
      description: 'Hash field name',
    },
    {
      id: 'value',
      title: 'Value',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Value to store',
      condition: { field: 'operation', value: ['set', 'setnx', 'hset', 'lpush', 'rpush'] },
      required: true,
      description: 'Value to store',
    },
    {
      id: 'seconds',
      title: 'Seconds',
      type: 'short-input',
      layout: 'full',
      placeholder: '3600',
      condition: { field: 'operation', value: 'expire' },
      required: true,
      description: 'Time-to-live in seconds',
    },
    {
      id: 'increment',
      title: 'Increment',
      type: 'short-input',
      layout: 'full',
      placeholder: '1',
      condition: { field: 'operation', value: 'incrby' },
      required: true,
      description: 'Amount to increment by (can be negative)',
    },
    {
      id: 'start',
      title: 'Start Index',
      type: 'short-input',
      layout: 'full',
      placeholder: '0',
      condition: { field: 'operation', value: 'lrange' },
      required: true,
      description: 'Start index (0-based, negatives count from the end)',
    },
    {
      id: 'stop',
      title: 'Stop Index',
      type: 'short-input',
      layout: 'full',
      placeholder: '-1',
      condition: { field: 'operation', value: 'lrange' },
      required: true,
      description: 'Stop index (inclusive, -1 for the last element)',
    },
    {
      id: 'command',
      title: 'Command',
      type: 'short-input',
      layout: 'full',
      placeholder: 'SADD, ZADD, GETRANGE...',
      condition: { field: 'operation', value: 'command' },
      required: true,
      description: 'Redis command name',
    },
    {
      id: 'arguments',
      title: 'Arguments',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: '["myset", "value1", "value2"]',
      condition: { field: 'operation', value: 'command' },
      description: 'JSON array of command arguments',
    },
  ],
  tools: {
    access: [
      'redis_get',
      'redis_set',
      'redis_setnx',
      'redis_delete',
      'redis_exists',
      'redis_expire',
      'redis_ttl',
      'redis_persist',
      'redis_incr',
      'redis_incrby',
      'redis_keys',
      'redis_hget',
      'redis_hset',
      'redis_hdel',
      'redis_hgetall',
      'redis_llen',
      'redis_lpush',
      'redis_rpush',
      'redis_lpop',
      'redis_rpop',
      'redis_lrange',
      'redis_command',
    ],
    config: {
      tool: (params) => {
        const tool = OPERATION_TO_TOOL[params.operation]
        if (!tool) {
          throw new Error(`Invalid Redis operation: ${params.operation}`)
        }
        return tool
      },
      params: (params) => {
        const {
          operation,
          host,
          port,
          username,
          password,
          db,
          tls,
          key,
          pattern,
          field,
          value,
          seconds,
          increment,
          start,
          stop,
          command,
          arguments: rawArguments,
          ...rest
        } = params

        const base: Record<string, any> = {
          host,
          port: port === undefined || port === '' ? undefined : Number(port),
          username,
          password,
          db: db === undefined || db === '' ? undefined : Number(db),
          tls,
          ...rest,
        }

        switch (operation) {
          case 'keys':
            return { ...base, pattern }
          case 'expire':
            return { ...base, key, seconds: Number(seconds) }
          case 'incrby':
            return { ...base, key, increment: Number(increment) }
          case 'hget':
          case 'hdel':
            return { ...base, key, field }
          case 'hset':
            return { ...base, key, field, value }
          case 'set':
          case 'setnx':
          case 'lpush':
          case 'rpush':
            return { ...base, key, value }
          case 'lrange':
            return { ...base, key, start: Number(start), stop: Number(stop) }
          case 'command': {
            let parsedArguments: Array<string | number> = []
            if (rawArguments) {
              try {
                const parsed =
                  typeof rawArguments === 'string' ? JSON.parse(rawArguments) : rawArguments
                parsedArguments = Array.isArray(parsed) ? parsed : [parsed]
              } catch (error: any) {
                throw new Error(`Invalid JSON for Redis command arguments: ${error.message}`)
              }
            }
            return { ...base, command, arguments: parsedArguments }
          }
          default:
            return { ...base, key }
        }
      },
    },
  },
  inputs: {
    host: { type: 'string', description: 'Redis host or IP' },
    port: { type: 'number', description: 'Redis port' },
    username: { type: 'string', description: 'Redis ACL username' },
    password: { type: 'string', description: 'Redis password' },
    db: { type: 'number', description: 'Redis database index' },
    tls: { type: 'boolean', description: 'Enable TLS connection' },
    operation: { type: 'string', description: 'Operation to perform' },
    key: { type: 'string', description: 'Redis key' },
    pattern: { type: 'string', description: 'Glob pattern for KEYS' },
    field: { type: 'string', description: 'Hash field name' },
    value: { type: 'string', description: 'Value to store' },
    seconds: { type: 'number', description: 'TTL in seconds for EXPIRE' },
    increment: { type: 'number', description: 'Amount for INCRBY' },
    start: { type: 'number', description: 'Start index for LRANGE' },
    stop: { type: 'number', description: 'Stop index for LRANGE' },
    command: { type: 'string', description: 'Raw Redis command name' },
    arguments: { type: 'json', description: 'Arguments for the raw command' },
  },
  outputs: {
    result: {
      type: 'json',
      description: 'The reply returned by the Redis command',
    },
    error: {
      type: 'string',
      description: 'Error message if the command failed',
    },
  },
}
