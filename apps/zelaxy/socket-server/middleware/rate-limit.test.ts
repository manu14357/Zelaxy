/**
 * Unit tests for the per-socket token-bucket rate limiter.
 *
 * @vitest-environment node
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  classifyOperation,
  cleanupRateLimiter,
  consumeToken,
  enforceRateLimit,
  getTrackedSocketCount,
  LOOSE_CONFIG,
  TIGHT_CONFIG,
} from '@/socket-server/middleware/rate-limit'

let socketSeq = 0
function freshSocketId(): string {
  socketSeq += 1
  return `sock-${socketSeq}-${Math.random().toString(36).slice(2)}`
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('classifyOperation', () => {
  it('routes position ops to the LOOSE bucket', () => {
    expect(classifyOperation('update-position', 'block')).toBe('loose')
    expect(classifyOperation('batch-update-positions', 'blocks')).toBe('loose')
  })

  it('routes mutating ops to the TIGHT bucket', () => {
    expect(classifyOperation('add', 'block')).toBe('tight')
    expect(classifyOperation('remove', 'block')).toBe('tight')
    expect(classifyOperation('update', 'subflow')).toBe('tight')
    // A position-shaped operation with a mismatched target is NOT the read-only-safe path.
    expect(classifyOperation('update-position', 'blocks')).toBe('tight')
    expect(classifyOperation(undefined, undefined)).toBe('tight')
  })
})

describe('consumeToken token bucket', () => {
  it('allows ops up to bucket capacity, then blocks', () => {
    const id = freshSocketId()
    const now = 1_000_000
    // Freeze time so no refill occurs mid-burst.
    for (let i = 0; i < TIGHT_CONFIG.capacity; i++) {
      expect(consumeToken(id, 'tight', now).allowed).toBe(true)
    }
    const blocked = consumeToken(id, 'tight', now)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterMs).toBeGreaterThan(0)
    cleanupRateLimiter(id)
  })

  it('refills tokens over time', () => {
    const id = freshSocketId()
    const start = 2_000_000
    // Drain the tight bucket completely.
    for (let i = 0; i < TIGHT_CONFIG.capacity; i++) consumeToken(id, 'tight', start)
    expect(consumeToken(id, 'tight', start).allowed).toBe(false)

    // After 1 second, refillPerSec tokens should be available again.
    const later = start + 1000
    let allowedAfterRefill = 0
    for (let i = 0; i < TIGHT_CONFIG.refillPerSec; i++) {
      if (consumeToken(id, 'tight', later).allowed) allowedAfterRefill++
    }
    expect(allowedAfterRefill).toBe(TIGHT_CONFIG.refillPerSec)
    // And exhausted again immediately after.
    expect(consumeToken(id, 'tight', later).allowed).toBe(false)
    cleanupRateLimiter(id)
  })

  it('keeps the LOOSE bucket far more generous than the TIGHT bucket', () => {
    expect(LOOSE_CONFIG.capacity).toBeGreaterThan(TIGHT_CONFIG.capacity)
    expect(LOOSE_CONFIG.refillPerSec).toBeGreaterThan(TIGHT_CONFIG.refillPerSec)

    const id = freshSocketId()
    const now = 3_000_000
    // A sustained 60fps drag burst (>tight capacity) sails through the loose bucket untouched.
    for (let i = 0; i < TIGHT_CONFIG.capacity + 50; i++) {
      expect(consumeToken(id, 'loose', now).allowed).toBe(true)
    }
    cleanupRateLimiter(id)
  })

  it('tracks the two buckets independently per socket', () => {
    const id = freshSocketId()
    const now = 4_000_000
    // Drain tight; loose must remain unaffected.
    for (let i = 0; i < TIGHT_CONFIG.capacity; i++) consumeToken(id, 'tight', now)
    expect(consumeToken(id, 'tight', now).allowed).toBe(false)
    expect(consumeToken(id, 'loose', now).allowed).toBe(true)
    cleanupRateLimiter(id)
  })

  it('isolates buckets between different sockets', () => {
    const a = freshSocketId()
    const b = freshSocketId()
    const now = 5_000_000
    for (let i = 0; i < TIGHT_CONFIG.capacity; i++) consumeToken(a, 'tight', now)
    expect(consumeToken(a, 'tight', now).allowed).toBe(false)
    // b has its own fresh bucket.
    expect(consumeToken(b, 'tight', now).allowed).toBe(true)
    cleanupRateLimiter(a)
    cleanupRateLimiter(b)
  })
})

describe('cleanupRateLimiter', () => {
  it('removes a socket from the tracked map', () => {
    const id = freshSocketId()
    const before = getTrackedSocketCount()
    consumeToken(id, 'tight')
    expect(getTrackedSocketCount()).toBe(before + 1)
    cleanupRateLimiter(id)
    expect(getTrackedSocketCount()).toBe(before)
  })
})

describe('enforceRateLimit', () => {
  function makeSocket(id: string) {
    return { id, emit: vi.fn() } as any
  }

  it('allows an op while tokens remain and does not emit failure', () => {
    const socket = makeSocket(freshSocketId())
    expect(enforceRateLimit(socket, 'tight', 'op-1')).toBe(true)
    expect(socket.emit).not.toHaveBeenCalled()
    cleanupRateLimiter(socket.id)
  })

  it('rejects via operation-failed (retryable) once the bucket is exhausted', () => {
    const socket = makeSocket(freshSocketId())
    for (let i = 0; i < TIGHT_CONFIG.capacity; i++) {
      enforceRateLimit(socket, 'tight', `op-${i}`)
    }
    socket.emit.mockClear()
    const allowed = enforceRateLimit(socket, 'tight', 'op-over')
    expect(allowed).toBe(false)
    expect(socket.emit).toHaveBeenCalledWith('operation-failed', {
      operationId: 'op-over',
      error: expect.any(String),
      retryable: true,
    })
    cleanupRateLimiter(socket.id)
  })

  it('does not emit for a rejected op with no operationId (nothing queue-tracked to fail)', () => {
    const socket = makeSocket(freshSocketId())
    for (let i = 0; i < TIGHT_CONFIG.capacity; i++) enforceRateLimit(socket, 'tight', undefined)
    socket.emit.mockClear()
    expect(enforceRateLimit(socket, 'tight', undefined)).toBe(false)
    expect(socket.emit).not.toHaveBeenCalled()
    cleanupRateLimiter(socket.id)
  })
})
