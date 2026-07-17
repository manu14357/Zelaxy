import { beforeEach, describe, expect, it, vi } from 'vitest'

// In-memory stand-in for Redis so the tests exercise the real cancellation logic without a server.
const store = new Map<string, string>()
const redisMock = {
  set: vi.fn(async (key: string, value: string) => {
    store.set(key, value)
    return 'OK'
  }),
  exists: vi.fn(async (key: string) => (store.has(key) ? 1 : 0)),
  del: vi.fn(async (key: string) => {
    store.delete(key)
    return 1
  }),
}

let redisAvailable = true

vi.mock('@/lib/redis', () => ({
  getRedisClient: () => (redisAvailable ? redisMock : null),
}))

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import {
  clearExecutionCancellation,
  isDistributedCancellationEnabled,
  isExecutionCancelled,
  markExecutionCancelled,
} from './cancellation'

describe('distributed cancellation', () => {
  beforeEach(() => {
    store.clear()
    redisAvailable = true
    vi.clearAllMocks()
  })

  it('a cancelled execution reads back as cancelled', async () => {
    const res = await markExecutionCancelled('exec-1')
    expect(res).toEqual({ durablyRecorded: true, reason: 'recorded' })
    expect(await isExecutionCancelled('exec-1')).toBe(true)
  })

  it('an unrelated execution is unaffected', async () => {
    await markExecutionCancelled('exec-1')
    expect(await isExecutionCancelled('exec-2')).toBe(false)
  })

  it('clearing removes the flag, so a reused id does not inherit cancellation', async () => {
    await markExecutionCancelled('exec-1')
    await clearExecutionCancellation('exec-1')
    expect(await isExecutionCancelled('exec-1')).toBe(false)
  })

  it('sets a TTL so cancel keys cannot accumulate forever', async () => {
    await markExecutionCancelled('exec-1')
    expect(redisMock.set).toHaveBeenCalledWith(
      'execution:cancel:exec-1',
      '1',
      'EX',
      expect.any(Number)
    )
  })

  describe('without Redis (single-instance / self-hosted)', () => {
    beforeEach(() => {
      redisAvailable = false
    })

    it('reports the feature as disabled', () => {
      expect(isDistributedCancellationEnabled()).toBe(false)
    })

    it('marking returns redis_unavailable rather than a false success', async () => {
      const res = await markExecutionCancelled('exec-1')
      expect(res).toEqual({ durablyRecorded: false, reason: 'redis_unavailable' })
    })

    it('checking fails open — a run continues rather than being aborted by a missing store', async () => {
      expect(await isExecutionCancelled('exec-1')).toBe(false)
    })
  })

  it('a Redis read failure fails open, continuing the run', async () => {
    redisMock.exists.mockRejectedValueOnce(new Error('connection reset'))
    expect(await isExecutionCancelled('exec-1')).toBe(false)
  })

  it('a Redis write failure is reported, not swallowed as success', async () => {
    redisMock.set.mockRejectedValueOnce(new Error('connection reset'))
    const res = await markExecutionCancelled('exec-1')
    expect(res).toEqual({ durablyRecorded: false, reason: 'redis_write_failed' })
  })
})
