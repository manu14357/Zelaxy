import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createCreditPurchaseOrderMock, adjustCreditBalanceMock } = vi.hoisted(() => ({
  createCreditPurchaseOrderMock: vi.fn(),
  adjustCreditBalanceMock: vi.fn(),
}))

vi.mock('@/lib/billing/razorpay/orders', () => ({
  createCreditPurchaseOrder: createCreditPurchaseOrderMock,
}))

vi.mock('@/lib/billing/credits/balance', () => ({
  adjustCreditBalance: adjustCreditBalanceMock,
}))

vi.mock('@/lib/env', () => ({
  env: { RAZORPAY_KEY_ID: 'rzp_test_key' },
}))

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import {
  createCreditPurchaseCheckout,
  handleCreditPurchaseCompleted,
  MAX_CREDIT_PURCHASE,
  MIN_CREDIT_PURCHASE,
} from '@/lib/billing/credits/purchase'

describe('createCreditPurchaseCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects amounts below the minimum', async () => {
    await expect(createCreditPurchaseCheckout('user_1', MIN_CREDIT_PURCHASE - 1)).rejects.toThrow(
      /between/
    )
  })

  it('rejects amounts above the maximum', async () => {
    await expect(createCreditPurchaseCheckout('user_1', MAX_CREDIT_PURCHASE + 1)).rejects.toThrow(
      /between/
    )
  })

  it('creates a Razorpay order with the correct amount and returns checkout details', async () => {
    createCreditPurchaseOrderMock.mockResolvedValue({ orderId: 'order_1', amountPaise: 50000 })

    const result = await createCreditPurchaseCheckout('user_1', 500)

    expect(result).toEqual({
      orderId: 'order_1',
      amountPaise: 50000,
      currency: 'INR',
      keyId: 'rzp_test_key',
    })
    expect(createCreditPurchaseOrderMock).toHaveBeenCalledWith('user_1', 500)
  })
})

describe('handleCreditPurchaseCompleted', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ignores payments that are not credit purchases', async () => {
    await handleCreditPurchaseCompleted({
      id: 'pay_1',
      order_id: 'order_1',
      notes: { zelaxyOrderType: 'something_else' },
    })

    expect(adjustCreditBalanceMock).not.toHaveBeenCalled()
  })

  it('credits the user balance, converted from INR to the internal credit unit', async () => {
    await handleCreditPurchaseCompleted({
      id: 'pay_1',
      order_id: 'order_1',
      notes: {
        zelaxyOrderType: 'credit_purchase',
        zelaxyUserId: 'user_1',
        zelaxyAmountRupees: '830',
      },
    })

    expect(adjustCreditBalanceMock).toHaveBeenCalledWith(
      'user_1',
      10,
      'purchase',
      expect.objectContaining({ relatedInvoiceId: 'pay_1' })
    )
  })

  it('does not throw and does not credit anything if notes are missing userId/amount', async () => {
    await expect(
      handleCreditPurchaseCompleted({
        id: 'pay_1',
        order_id: 'order_1',
        notes: { zelaxyOrderType: 'credit_purchase' },
      })
    ).resolves.toBeUndefined()

    expect(adjustCreditBalanceMock).not.toHaveBeenCalled()
  })
})
