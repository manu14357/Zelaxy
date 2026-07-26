import { describe, expect, it, vi } from 'vitest'

// The id helpers are pure; stub out the db/schema imports so importing the
// module doesn't pull in a real database or the full schema graph.
vi.mock('@/db', () => ({ db: {} }))
vi.mock('@/db/schema', () => ({ billingInvoice: {} }))
vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import {
  invoiceIdForOrder,
  invoiceIdForPayment,
  invoiceIdForPaymentLink,
  invoiceIdForSubscription,
} from './ledger'

describe('billing invoice id helpers', () => {
  it('collapses the same subscription + period to one id (verify + webhook dedupe)', () => {
    const period = new Date('2026-02-01T00:00:00Z')
    expect(invoiceIdForSubscription('sub_1', period)).toBe(
      invoiceIdForSubscription('sub_1', new Date(period.getTime()))
    )
  })

  it('gives a distinct id per billing period so each renewal gets its own receipt', () => {
    const p1 = new Date('2026-02-01T00:00:00Z')
    const p2 = new Date('2026-03-01T00:00:00Z')
    expect(invoiceIdForSubscription('sub_1', p1)).not.toBe(invoiceIdForSubscription('sub_1', p2))
  })

  it('falls back to a stable id when the period is unknown', () => {
    expect(invoiceIdForSubscription('sub_1', null)).toBe('inv_sub_sub_1_na')
  })

  it('derives stable, distinct ids for orders, payments, and payment links', () => {
    expect(invoiceIdForOrder('order_x')).toBe('inv_order_order_x')
    expect(invoiceIdForPayment('pay_x')).toBe('inv_pay_pay_x')
    expect(invoiceIdForPaymentLink('plink_x')).toBe('inv_pl_plink_x')
  })
})
