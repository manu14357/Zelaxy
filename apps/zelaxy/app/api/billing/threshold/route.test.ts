import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { processThresholdBillingCheckMock } = vi.hoisted(() => ({
  processThresholdBillingCheckMock: vi.fn(),
}))

vi.mock('@/lib/auth/internal', () => ({
  verifyCronAuth: vi.fn(() => null), // null = auth passed
}))

vi.mock('@/lib/billing/threshold-billing', () => ({
  processThresholdBillingCheck: processThresholdBillingCheckMock,
}))

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { GET, POST } from './route'

describe('GET /api/billing/threshold (the actual Vercel Cron entry point)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('actually runs processThresholdBillingCheck', async () => {
    processThresholdBillingCheckMock.mockResolvedValue({
      success: true,
      candidateCount: 10,
      settledCount: 2,
      totalCharged: 150,
      totalCreditsApplied: 40,
      errors: [],
    })

    const response = await GET(new NextRequest('http://localhost/api/billing/threshold'))
    const body = await response.json()

    expect(processThresholdBillingCheckMock).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(200)
    expect(body.summary.settledCount).toBe(2)
    expect(body.summary.totalCharged).toBe(150)
  })

  it('returns a 500 with error details when the check reports failures', async () => {
    processThresholdBillingCheckMock.mockResolvedValue({
      success: false,
      candidateCount: 5,
      settledCount: 0,
      totalCharged: 0,
      totalCreditsApplied: 0,
      errors: ['User user_1: Razorpay error'],
    })

    const response = await GET(new NextRequest('http://localhost/api/billing/threshold'))
    expect(response.status).toBe(500)
  })
})

describe('POST /api/billing/threshold (manual/API invocation)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('also runs the real check', async () => {
    processThresholdBillingCheckMock.mockResolvedValue({
      success: true,
      candidateCount: 0,
      settledCount: 0,
      totalCharged: 0,
      totalCreditsApplied: 0,
      errors: [],
    })

    const response = await POST(
      new NextRequest('http://localhost/api/billing/threshold', { method: 'POST' })
    )
    expect(response.status).toBe(200)
    expect(processThresholdBillingCheckMock).toHaveBeenCalledTimes(1)
  })
})
