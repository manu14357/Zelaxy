import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { processDailyCreditRefreshMock } = vi.hoisted(() => ({
  processDailyCreditRefreshMock: vi.fn(),
}))

vi.mock('@/lib/auth/internal', () => ({
  verifyCronAuth: vi.fn(() => null), // null = auth passed
}))

vi.mock('@/lib/billing/credits/refresh', () => ({
  processDailyCreditRefresh: processDailyCreditRefreshMock,
}))

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { GET, POST } from './route'

describe('GET /api/billing/credits/refresh (the actual Vercel Cron entry point)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('actually runs processDailyCreditRefresh', async () => {
    processDailyCreditRefreshMock.mockResolvedValue({
      success: true,
      processedUsers: 4,
      totalRefreshed: 0.8,
      errors: [],
    })

    const response = await GET(new NextRequest('http://localhost/api/billing/credits/refresh'))
    const body = await response.json()

    expect(processDailyCreditRefreshMock).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(200)
    expect(body.summary.processedUsers).toBe(4)
    expect(body.summary.totalRefreshed).toBe(0.8)
  })

  it('returns a 500 with error details when the refresh reports failures', async () => {
    processDailyCreditRefreshMock.mockResolvedValue({
      success: false,
      processedUsers: 1,
      totalRefreshed: 0.2,
      errors: ['User user_1: DB error'],
    })

    const response = await GET(new NextRequest('http://localhost/api/billing/credits/refresh'))
    expect(response.status).toBe(500)
  })
})

describe('POST /api/billing/credits/refresh (manual/API invocation)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('also runs the real refresh', async () => {
    processDailyCreditRefreshMock.mockResolvedValue({
      success: true,
      processedUsers: 0,
      totalRefreshed: 0,
      errors: [],
    })

    const response = await POST(
      new NextRequest('http://localhost/api/billing/credits/refresh', { method: 'POST' })
    )
    expect(response.status).toBe(200)
    expect(processDailyCreditRefreshMock).toHaveBeenCalledTimes(1)
  })
})
