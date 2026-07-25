import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getCreditBalanceMock } = vi.hoisted(() => ({ getCreditBalanceMock: vi.fn() }))

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/billing/credits/balance', () => ({
  getCreditBalance: getCreditBalanceMock,
}))

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { getSession } from '@/lib/auth'
import { GET } from './route'

describe('GET /api/billing/credits/balance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated requests', async () => {
    ;(getSession as any).mockResolvedValue(null)

    const response = await GET()
    expect(response.status).toBe(401)
  })

  it("returns the session user's credit balance", async () => {
    ;(getSession as any).mockResolvedValue({ user: { id: 'user_1' } })
    getCreditBalanceMock.mockResolvedValue(12.5)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.balance).toBe(12.5)
    expect(getCreditBalanceMock).toHaveBeenCalledWith('user_1')
  })
})
