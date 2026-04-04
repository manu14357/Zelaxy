/**
 * Tests for Wait / Delay tool API route
 *
 * @vitest-environment node
 */
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('Delay Tool API Route', () => {
  let POST: typeof import('./route').POST

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('./route')
    POST = mod.POST
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function makeRequest(body: Record<string, unknown>): NextRequest {
    return new NextRequest('http://localhost/api/tools/delay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('should delay for the specified duration in seconds', async () => {
    const start = Date.now()
    const res = await POST(makeRequest({ duration: 0.1, unit: 'seconds' }))
    const elapsed = Date.now() - start
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.output.delayed).toBe(true)
    expect(data.output.duration).toBe(0.1)
    expect(data.output.unit).toBe('seconds')
    expect(data.output.delayMs).toBe(100)
    expect(data.output.startedAt).toBeDefined()
    expect(data.output.completedAt).toBeDefined()
    expect(elapsed).toBeGreaterThanOrEqual(80) // allow some timing tolerance
  })

  it('should delay for the specified duration in minutes', async () => {
    // Use a very small minute value so the test is fast
    const res = await POST(makeRequest({ duration: 0.001, unit: 'minutes' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.output.unit).toBe('minutes')
    expect(data.output.delayMs).toBe(60) // 0.001 * 60000
  })

  it('should return 400 for missing duration', async () => {
    const res = await POST(makeRequest({ unit: 'seconds' }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toMatch(/duration/i)
  })

  it('should return 400 for negative duration', async () => {
    const res = await POST(makeRequest({ duration: -5, unit: 'seconds' }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should return 400 for zero duration', async () => {
    const res = await POST(makeRequest({ duration: 0, unit: 'seconds' }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should return 400 for invalid unit', async () => {
    const res = await POST(makeRequest({ duration: 5, unit: 'weeks' }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toMatch(/unit/i)
  })

  it('should return 400 for missing unit', async () => {
    const res = await POST(makeRequest({ duration: 5 }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should return 400 when delay exceeds 1 hour', async () => {
    const res = await POST(makeRequest({ duration: 2, unit: 'hours' }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toMatch(/maximum/i)
  })

  it('should accept exactly 1 hour', async () => {
    // Mock setTimeout to avoid actually waiting 1 hour
    vi.useFakeTimers()
    const promise = POST(makeRequest({ duration: 1, unit: 'hours' }))
    // Advance timers in a microtask so the awaited setTimeout resolves
    await vi.advanceTimersByTimeAsync(3_600_000)
    const res = await promise
    const data = await res.json()
    vi.useRealTimers()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.output.delayMs).toBe(3_600_000)
  }, 15_000)

  it('should return 500 on unexpected errors', async () => {
    // Send invalid JSON
    const req = new NextRequest('http://localhost/api/tools/delay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json{',
    })
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.success).toBe(false)
  })
})
