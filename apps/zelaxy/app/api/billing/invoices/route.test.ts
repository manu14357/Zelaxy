import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { memberRows, invoiceRows } = vi.hoisted(() => ({
  memberRows: { value: [] as any[] },
  invoiceRows: { value: [] as any[] },
}))

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

// Only the org-authorization membership check hits the db directly; the
// invoice rows come from the mocked ledger module below.
vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(() => Promise.resolve(memberRows.value)),
  },
}))

vi.mock('@/lib/billing/invoices/ledger', () => ({
  listInvoicesForReference: vi.fn(() => Promise.resolve(invoiceRows.value)),
}))

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { getSession } from '@/lib/auth'
import { listInvoicesForReference } from '@/lib/billing/invoices/ledger'
import { GET } from './route'

function invoiceRow(overrides: Record<string, any> = {}) {
  return {
    id: 'inv_sub_sub_1_100',
    referenceId: 'user_1',
    userId: 'user_1',
    organizationId: null,
    type: 'subscription',
    status: 'paid',
    amountDue: '1999',
    amountPaid: '1999',
    currency: 'INR',
    description: 'Pro plan',
    plan: 'pro',
    seats: 1,
    razorpayPaymentId: null,
    razorpayOrderId: null,
    razorpaySubscriptionId: 'sub_1',
    razorpayPaymentLinkId: null,
    hostedInvoiceUrl: null,
    billingPeriodStart: null,
    billingPeriodEnd: null,
    metadata: null,
    createdAt: new Date('2026-02-01T00:00:00Z'),
    paidAt: new Date('2026-02-01T00:00:00Z'),
    ...overrides,
  }
}

describe('GET /api/billing/invoices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    memberRows.value = []
    invoiceRows.value = []
  })

  it('rejects unauthenticated requests', async () => {
    ;(getSession as any).mockResolvedValue(null)
    const response = await GET(new NextRequest('http://localhost/api/billing/invoices'))
    expect(response.status).toBe(401)
  })

  it("returns the current user's invoices, mapped from the ledger with numeric amounts", async () => {
    ;(getSession as any).mockResolvedValue({ user: { id: 'user_1' } })
    invoiceRows.value = [invoiceRow()]

    const response = await GET(new NextRequest('http://localhost/api/billing/invoices'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(listInvoicesForReference).toHaveBeenCalledWith('user_1', 10)
    expect(body.data).toHaveLength(1)
    expect(body.data[0]).toMatchObject({
      id: 'inv_sub_sub_1_100',
      status: 'paid',
      amountPaid: 1999,
      amountDue: 1999,
      currency: 'INR',
      type: 'subscription',
    })
    expect(body.data[0].created).toBe('2026-02-01T00:00:00.000Z')
  })

  it('returns an empty list when the user has no invoices', async () => {
    ;(getSession as any).mockResolvedValue({ user: { id: 'user_1' } })
    invoiceRows.value = []

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
    expect(listInvoicesForReference).not.toHaveBeenCalled()
  })

  it('lets an org admin view the organization invoice history, scoped by org id', async () => {
    ;(getSession as any).mockResolvedValue({ user: { id: 'user_1' } })
    memberRows.value = [{ role: 'admin' }]
    invoiceRows.value = [
      invoiceRow({ id: 'inv_org_1', referenceId: 'org_1', organizationId: 'org_1' }),
    ]

    const response = await GET(
      new NextRequest('http://localhost/api/billing/invoices?organizationId=org_1')
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(listInvoicesForReference).toHaveBeenCalledWith('org_1', 10)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe('inv_org_1')
  })
})
