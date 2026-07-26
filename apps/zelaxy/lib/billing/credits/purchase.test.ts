import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createCreditPurchaseOrderMock,
  adjustCreditBalanceMock,
  recordInvoiceMock,
  sendCreditReceiptEmailMock,
} = vi.hoisted(() => ({
  createCreditPurchaseOrderMock: vi.fn(),
  adjustCreditBalanceMock: vi.fn(),
  recordInvoiceMock: vi.fn(() => Promise.resolve({ created: true })),
  sendCreditReceiptEmailMock: vi.fn(),
}))

vi.mock('@/lib/billing/razorpay/orders', () => ({
  createCreditPurchaseOrder: createCreditPurchaseOrderMock,
}))

vi.mock('@/lib/billing/credits/balance', () => ({
  adjustCreditBalance: adjustCreditBalanceMock,
}))

vi.mock('@/lib/billing/invoices/ledger', () => ({
  recordInvoice: recordInvoiceMock,
  invoiceIdForPayment: (id: string) => `inv_pay_${id}`,
}))

vi.mock('@/lib/billing/emails', () => ({
  sendCreditReceiptEmail: sendCreditReceiptEmailMock,
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
    expect(recordInvoiceMock).not.toHaveBeenCalled()
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

    // The grant is keyed on the payment id; adjustCreditBalance dedups on that
    // key inside its row lock, so a stale redelivery credits at most once
    // (idempotency behavior itself is covered in balance.test.ts).
    expect(adjustCreditBalanceMock).toHaveBeenCalledWith(
      'user_1',
      10,
      'purchase',
      expect.objectContaining({ idempotencyKey: 'pay_1' })
    )
    // A receipt is recorded in the local ledger, keyed idempotently on the
    // payment id, denominated in the INR actually paid (not the credit units).
    expect(recordInvoiceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'inv_pay_pay_1',
        referenceId: 'user_1',
        type: 'credit_purchase',
        status: 'paid',
        amountPaid: 830,
        currency: 'INR',
        razorpayPaymentId: 'pay_1',
      })
    )
    // A receipt email is sent, gated on the newly-written invoice.
    expect(sendCreditReceiptEmailMock).toHaveBeenCalledWith('user_1', {
      amountRupees: 830,
      creditUnits: 10,
    })
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
    expect(recordInvoiceMock).not.toHaveBeenCalled()
  })
})
