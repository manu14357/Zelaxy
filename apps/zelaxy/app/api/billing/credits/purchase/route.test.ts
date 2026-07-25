import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createCheckoutMock } = vi.hoisted(() => ({ createCheckoutMock: vi.fn() }))

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/billing/credits/purchase', () => ({
  createCreditPurchaseCheckout: createCheckoutMock,
  MIN_CREDIT_PURCHASE: 100,
  MAX_CREDIT_PURCHASE: 50000,
}))

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { getSession } from '@/lib/auth'
import { POST } from './route'

describe('POST /api/billing/credits/purchase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated requests', async () => {
    ;(getSession as any).mockResolvedValue(null)
    const request = new NextRequest('http://localhost/api/billing/credits/purchase', {
      method: 'POST',
      body: JSON.stringify({ amountRupees: 500 }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('rejects an amount outside the allowed range', async () => {
    ;(getSession as any).mockResolvedValue({ user: { id: 'user_1' } })
    const request = new NextRequest('http://localhost/api/billing/credits/purchase', {
      method: 'POST',
      body: JSON.stringify({ amountRupees: 1 }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    expect(createCheckoutMock).not.toHaveBeenCalled()
  })

  it('returns the Razorpay order/checkout details for a valid request', async () => {
    ;(getSession as any).mockResolvedValue({ user: { id: 'user_1' } })
    createCheckoutMock.mockResolvedValue({
      orderId: 'order_1',
      amountPaise: 50000,
      currency: 'INR',
      keyId: 'rzp_test_key',
    })

    const request = new NextRequest('http://localhost/api/billing/credits/purchase', {
      method: 'POST',
      body: JSON.stringify({ amountRupees: 500 }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      orderId: 'order_1',
      amountPaise: 50000,
      currency: 'INR',
      keyId: 'rzp_test_key',
    })
    expect(createCheckoutMock).toHaveBeenCalledWith('user_1', 500)
  })
})
