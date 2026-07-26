import { beforeEach, describe, expect, it, vi } from 'vitest'

const { updateSet, updateWhere, selectLimitResult } = vi.hoisted(() => ({
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  selectLimitResult: { value: [] as any[] },
}))

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(() => Promise.resolve(selectLimitResult.value)),
    update: vi.fn(() => ({
      set: vi.fn((values: any) => {
        updateSet(values)
        return {
          where: vi.fn((cond: any) => {
            updateWhere(cond)
            return Promise.resolve()
          }),
        }
      }),
    })),
  },
}))

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

vi.mock('@/lib/billing/core/billing', () => ({
  processUserOverageBilling: vi.fn(),
  processOrganizationOverageBilling: vi.fn(),
}))

import {
  processOrganizationOverageBilling,
  processUserOverageBilling,
} from '@/lib/billing/core/billing'
import { handleSubscriptionDeleted } from '@/lib/billing/webhooks/subscription'

describe('handleSubscriptionDeleted', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    selectLimitResult.value = []
  })

  it('is a no-op billing-wise for a free-plan subscription, but still marks it ended', async () => {
    const result = await handleSubscriptionDeleted({
      id: 'sub_1',
      referenceId: 'user_1',
      plan: 'free',
    })

    expect(result.finalOverageCharged).toBe(0)
    expect(processUserOverageBilling).not.toHaveBeenCalled()
    expect(processOrganizationOverageBilling).not.toHaveBeenCalled()
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ status: 'canceled' }))
  })

  it('bills final overage for an individual (user-referenced) subscription', async () => {
    selectLimitResult.value = [] // referenceId doesn't match an organization row
    ;(processUserOverageBilling as any).mockResolvedValue({
      success: true,
      chargedAmount: 15,
      paymentLinkId: 'in_123',
    })

    const result = await handleSubscriptionDeleted({
      id: 'sub_2',
      referenceId: 'user_2',
      plan: 'pro',
    })

    expect(processUserOverageBilling).toHaveBeenCalledWith('user_2')
    expect(processOrganizationOverageBilling).not.toHaveBeenCalled()
    expect(result.isOrganization).toBe(false)
    expect(result.finalOverageCharged).toBe(15)
    expect(result.finalPaymentLinkId).toBe('in_123')
  })

  it('bills final overage for an organization-referenced subscription', async () => {
    selectLimitResult.value = [{ id: 'org_1' }] // referenceId matches an organization row
    ;(processOrganizationOverageBilling as any).mockResolvedValue({
      success: true,
      chargedAmount: 200,
      paymentLinkId: 'in_456',
    })

    const result = await handleSubscriptionDeleted({
      id: 'sub_3',
      referenceId: 'org_1',
      plan: 'team',
    })

    expect(processOrganizationOverageBilling).toHaveBeenCalledWith('org_1')
    expect(processUserOverageBilling).not.toHaveBeenCalled()
    expect(result.isOrganization).toBe(true)
    expect(result.finalOverageCharged).toBe(200)
  })

  it('still marks the subscription ended even if final overage billing fails', async () => {
    selectLimitResult.value = []
    ;(processUserOverageBilling as any).mockRejectedValue(new Error('Razorpay down'))

    const result = await handleSubscriptionDeleted({
      id: 'sub_4',
      referenceId: 'user_4',
      plan: 'pro',
    })

    expect(result.finalOverageCharged).toBe(0)
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ status: 'canceled' }))
  })

  it('uses the provided canceledAt/endedAt timestamps when given', async () => {
    selectLimitResult.value = []
    ;(processUserOverageBilling as any).mockResolvedValue({ success: true, chargedAmount: 0 })

    const canceledAt = new Date('2026-01-01T00:00:00Z')
    const endedAt = new Date('2026-01-02T00:00:00Z')

    await handleSubscriptionDeleted({
      id: 'sub_5',
      referenceId: 'user_5',
      plan: 'pro',
      canceledAt,
      endedAt,
    })

    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ canceledAt, endedAt, status: 'canceled' })
    )
  })
})
