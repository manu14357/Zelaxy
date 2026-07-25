import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { processDailyBillingCheckMock } = vi.hoisted(() => ({
  processDailyBillingCheckMock: vi.fn(),
}))

vi.mock('@/lib/auth/internal', () => ({
  verifyCronAuth: vi.fn(() => null), // null = auth passed
}))

vi.mock('@/lib/billing/core/billing', () => ({
  processDailyBillingCheck: processDailyBillingCheckMock,
}))

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { GET, POST } from './route'

describe('GET /api/billing/daily (the actual Vercel Cron entry point)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('actually runs processDailyBillingCheck, not just a health-check stub', async () => {
    processDailyBillingCheckMock.mockResolvedValue({
      success: true,
      processedUsers: 3,
      processedOrganizations: 1,
      totalChargedAmount: 42.5,
      errors: [],
    })

    const response = await GET(new NextRequest('http://localhost/api/billing/daily'))
    const body = await response.json()

    expect(processDailyBillingCheckMock).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(200)
    expect(body.summary.processedUsers).toBe(3)
    expect(body.summary.totalChargedAmount).toBe(42.5)
  })

  it('returns a 500 with error details when the check reports failures', async () => {
    processDailyBillingCheckMock.mockResolvedValue({
      success: false,
      processedUsers: 1,
      processedOrganizations: 0,
      totalChargedAmount: 0,
      errors: ['User user_1: Razorpay error'],
    })

    const response = await GET(new NextRequest('http://localhost/api/billing/daily'))
    expect(response.status).toBe(500)
  })
})

describe('POST /api/billing/daily (manual/API invocation)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('also runs the real check', async () => {
    processDailyBillingCheckMock.mockResolvedValue({
      success: true,
      processedUsers: 0,
      processedOrganizations: 0,
      totalChargedAmount: 0,
      errors: [],
    })

    const response = await POST(
      new NextRequest('http://localhost/api/billing/daily', { method: 'POST' })
    )
    expect(response.status).toBe(200)
    expect(processDailyBillingCheckMock).toHaveBeenCalledTimes(1)
  })
})
