import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { memberRows } = vi.hoisted(() => ({
  memberRows: { value: [] as any[] },
}))

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(() => Promise.resolve(memberRows.value)),
  },
}))

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { getSession } from '@/lib/auth'
import { GET } from './route'

describe('GET /api/billing/invoices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    memberRows.value = []
  })

  it('rejects unauthenticated requests', async () => {
    ;(getSession as any).mockResolvedValue(null)
    const response = await GET(new NextRequest('http://localhost/api/billing/invoices'))
    expect(response.status).toBe(401)
  })

  it('returns an empty list for the current user', async () => {
    ;(getSession as any).mockResolvedValue({ user: { id: 'user_1' } })

    const response = await GET(new NextRequest('http://localhost/api/billing/invoices'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toEqual([])
  })

  it('rejects viewing an organization the user is not an admin/owner of', async () => {
    ;(getSession as any).mockResolvedValue({ user: { id: 'user_1' } })
    memberRows.value = [{ role: 'member' }]

    const response = await GET(
      new NextRequest('http://localhost/api/billing/invoices?organizationId=org_1')
    )

    expect(response.status).toBe(403)
  })

  it('allows an org admin to view the (currently empty) organization invoice history', async () => {
    ;(getSession as any).mockResolvedValue({ user: { id: 'user_1' } })
    memberRows.value = [{ role: 'admin' }]

    const response = await GET(
      new NextRequest('http://localhost/api/billing/invoices?organizationId=org_1')
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toEqual([])
  })
})
