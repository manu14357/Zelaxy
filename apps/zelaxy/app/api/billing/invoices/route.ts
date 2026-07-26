import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { type BillingInvoiceRow, listInvoicesForReference } from '@/lib/billing/invoices/ledger'
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
  type: 'subscription' | 'plan_purchase' | 'overage' | 'credit_purchase' | 'other'
}

function toInvoiceHistoryItem(row: BillingInvoiceRow): InvoiceHistoryItem {
  const amountPaid = Number.parseFloat(row.amountPaid ?? '0')
  const amountDue = Number.parseFloat(row.amountDue ?? '0')
  return {
    id: row.id,
    status: row.status,
    amountDue: Number.isFinite(amountDue) ? amountDue : 0,
    amountPaid: Number.isFinite(amountPaid) ? amountPaid : 0,
    currency: row.currency,
    created: row.createdAt.toISOString(),
    hostedInvoiceUrl: row.hostedInvoiceUrl,
    description: row.description,
    type: (row.type as InvoiceHistoryItem['type']) ?? 'other',
  }
}

/**
 * GET /api/billing/invoices - Recent invoice history (last N, default 10).
 *
 * Backed by the local `billing_invoice` ledger (lib/billing/invoices/ledger),
 * which every payment-success path writes to. Razorpay's SDK exposes no
 * "list payments/invoices for a given customer" filter, so a local ledger is
 * the only reliable, authorization-scoped source for this view. Scoped by
 * referenceId: the caller's own user id, or an organization id they own/admin.
 */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { organizationId, limit } = QuerySchema.parse(Object.fromEntries(searchParams.entries()))

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

    // Team/enterprise invoices are keyed by organization id (the subscription
    // is re-pointed there on activation); everything else by the user id.
    const referenceId = organizationId ?? session.user.id
    const rows = await listInvoicesForReference(referenceId, limit)
    const data: InvoiceHistoryItem[] = rows.map(toInvoiceHistoryItem)
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
