import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/audit/service', () => ({
  extractRequestContext: vi.fn().mockReturnValue({}),
  recordAuditLog: vi.fn(),
}))

vi.mock('@/lib/billing/validation/seat-management', () => ({
  getOrganizationSeatAnalytics: vi.fn(),
  getOrganizationSeatInfo: vi.fn(),
}))

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

const { memberRow } = vi.hoisted(() => ({
  memberRow: { role: 'owner', organizationId: 'org_1', userId: 'user_1' },
}))

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([memberRow]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}))

import { getSession } from '@/lib/auth'
import { PUT } from './route'

describe('PUT /api/organizations/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getSession as any).mockResolvedValue({ user: { id: 'user_1' } })
  })

  it('rejects a request that tries to set seats directly instead of via Razorpay', async () => {
    const request = new NextRequest('http://localhost/api/organizations/org_1', {
      method: 'PUT',
      body: JSON.stringify({ seats: 10 }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: 'org_1' }) })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toMatch(/seat/i)
    expect(body.error).toMatch(/razorpay/i)
  })

  it('rejects even when seats is combined with a name change (no partial silent success)', async () => {
    const request = new NextRequest('http://localhost/api/organizations/org_1', {
      method: 'PUT',
      body: JSON.stringify({ seats: 5, name: 'New name' }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: 'org_1' }) })

    expect(response.status).toBe(400)
  })
})
