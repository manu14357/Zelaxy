import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { member } from '@/db/schema'

const logger = createLogger('BillingInvoicesAPI')

const QuerySchema = z.object({
  organizationId: z.string().optional(),
  limit: z.coerce.number().min(1).max(25).optional().default(10),
})

export interface InvoiceHistoryItem {
  id: string
  status: string | null
  amountDue: number
  amountPaid: number
  currency: string
  created: string
  hostedInvoiceUrl: string | null
  description: string | null
  type: 'subscription' | 'overage' | 'other'
}

/**
 * GET /api/billing/invoices - Recent invoice history (last N, default 10).
 *
 * Under Stripe this listed stripeClient.invoices.list({customer}). Razorpay's
 * REST API has no equivalent "list payments/payment links for a given
 * customer" filter exposed by this SDK - only pagination, no customer-id
 * query param. Reliably reconstructing this view needs a dedicated local
 * ledger table (recording every payment link/order we create), which is a
 * standalone follow-up, not part of the Stripe->Razorpay migration itself.
 * Returning an empty list here rather than scanning all of the merchant's
 * Razorpay payments to filter client-side, which wouldn't scale and would
 * mean fetching data far beyond what this endpoint's caller is authorized
 * to see.
 */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { organizationId } = QuerySchema.parse(Object.fromEntries(searchParams.entries()))

    if (organizationId) {
      // Only an org's owner/admin may view its invoice history.
      const memberEntry = await db
        .select({ role: member.role })
        .from(member)
        .where(and(eq(member.organizationId, organizationId), eq(member.userId, session.user.id)))
        .limit(1)

      if (memberEntry.length === 0 || !['owner', 'admin'].includes(memberEntry[0].role)) {
        return NextResponse.json(
          { error: 'Forbidden - admin access to this organization required' },
          { status: 403 }
        )
      }
    }

    const data: InvoiceHistoryItem[] = []
    return NextResponse.json({ data })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    logger.error(`[${requestId}] Failed to fetch invoice history`, { error })
    return NextResponse.json({ error: 'Failed to fetch invoice history' }, { status: 500 })
  }
}
