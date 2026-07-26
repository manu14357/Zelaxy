import { beforeEach, describe, expect, it, vi } from 'vitest'

const { updateSetCalls, sendPaymentFailedNoticeMock } = vi.hoisted(() => ({
  updateSetCalls: [] as any[],
  sendPaymentFailedNoticeMock: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    update: vi.fn(() => ({
      set: vi.fn((v: any) => {
        updateSetCalls.push(v)
        return { where: vi.fn(() => Promise.resolve()) }
      }),
    })),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn(() => Promise.resolve([])),
  },
}))

vi.mock('@/lib/billing/core/billing', () => ({ findAccountByRazorpayCustomerId: vi.fn() }))
vi.mock('@/lib/billing/emails', () => ({ sendPaymentFailedNotice: sendPaymentFailedNoticeMock }))
vi.mock('@/lib/billing/invoices/ledger', () => ({
  recordInvoice: vi.fn(() => Promise.resolve({ created: true })),
  invoiceIdForPaymentLink: (id: string) => `inv_pl_${id}`,
}))
vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { handleRecurringChargeFailed } from './razorpay-payment-webhooks'

describe('handleRecurringChargeFailed (dunning)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    updateSetCalls.length = 0
  })

  it('halted (retries exhausted): blocks access AND emails the user', async () => {
    await handleRecurringChargeFailed(
      { id: 'sub_1', notes: { zelaxyUserId: 'user_1' } },
      { block: true }
    )

    expect(updateSetCalls[0]).toMatchObject({ billingBlocked: true })
    expect(sendPaymentFailedNoticeMock).toHaveBeenCalledWith(
      'user_1',
      expect.objectContaining({ reason: expect.any(String) })
    )
  })

  it('pending (will retry): notifies WITHOUT blocking access', async () => {
    await handleRecurringChargeFailed(
      { id: 'sub_1', notes: { zelaxyUserId: 'user_1' } },
      { block: false }
    )

    expect(updateSetCalls).toHaveLength(0) // no billingBlocked write
    expect(sendPaymentFailedNoticeMock).toHaveBeenCalledWith('user_1', expect.any(Object))
  })

  it('resolves a subscription from zelaxyReferenceType/Id, not a customer-id lookup', async () => {
    // Subscriptions stamp {zelaxyReferenceId, zelaxyReferenceType} - never
    // zelaxyUserId. The reference id must resolve directly, not be fed to the
    // Razorpay customer-id lookup (a disjoint id space that never matches).
    await handleRecurringChargeFailed(
      { id: 'sub_1', notes: { zelaxyReferenceId: 'user_1', zelaxyReferenceType: 'user' } },
      { block: true }
    )

    expect(updateSetCalls[0]).toMatchObject({ billingBlocked: true })
    expect(sendPaymentFailedNoticeMock).toHaveBeenCalledWith('user_1', expect.any(Object))
  })

  it('is a no-op when no account can be resolved', async () => {
    await handleRecurringChargeFailed({ id: 'sub_x', notes: {} }, { block: true })

    expect(updateSetCalls).toHaveLength(0)
    expect(sendPaymentFailedNoticeMock).not.toHaveBeenCalled()
  })
})
