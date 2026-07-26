import { useEffect, useState } from 'react'
import { ExternalLink, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { createLogger } from '@/lib/logs/console/logger'
import type { InvoiceHistoryItem } from '@/app/api/billing/invoices/route'

const logger = createLogger('InvoiceHistory')

interface InvoiceHistoryProps {
  /** Pass the active organization's id to view its invoices instead of the current user's */
  organizationId?: string
}

// Keys are the statuses the local billing_invoice ledger actually emits
// (created | paid | failed | expired | refunded) - not Stripe's invoice states.
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  paid: 'default',
  created: 'outline',
  failed: 'destructive',
  expired: 'destructive',
  refunded: 'secondary',
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function formatAmount(amount: number, currency: string): string {
  const code = currency || 'INR'
  try {
    return new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${code} ${amount.toFixed(2)}`
  }
}

export function InvoiceHistory({ organizationId }: InvoiceHistoryProps) {
  const [invoices, setInvoices] = useState<InvoiceHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadInvoices() {
      setIsLoading(true)
      setError(null)
      try {
        const url = new URL('/api/billing/invoices', window.location.origin)
        if (organizationId) url.searchParams.set('organizationId', organizationId)

        const response = await fetch(url.toString())
        if (!response.ok) throw new Error('Failed to load invoice history')

        const { data } = await response.json()
        if (!cancelled) setInvoices(data || [])
      } catch (err) {
        logger.error('Failed to load invoice history', { error: err })
        if (!cancelled) setError('Could not load invoice history')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadInvoices()
    return () => {
      cancelled = true
    }
  }, [organizationId])

  if (isLoading) {
    return (
      <div className='space-y-2'>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className='h-10 w-full rounded-lg' />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className='text-[12px] text-muted-foreground'>{error}</p>
  }

  if (invoices.length === 0) {
    return (
      <div className='flex flex-col items-center gap-2 py-6 text-center'>
        <FileText className='h-5 w-5 text-muted-foreground/50' />
        <p className='text-[12px] text-muted-foreground'>No invoices yet.</p>
      </div>
    )
  }

  return (
    <div className='space-y-1'>
      {invoices.map((invoice) => (
        <div
          key={invoice.id}
          className='flex items-center justify-between gap-3 rounded-lg border border-border/40 px-3 py-2'
        >
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <span className='font-medium text-[13px] text-foreground'>
                {formatDate(invoice.created)}
              </span>
              {invoice.status && (
                <Badge
                  variant={STATUS_VARIANT[invoice.status] || 'outline'}
                  className='text-[10px] capitalize'
                >
                  {invoice.status}
                </Badge>
              )}
              {invoice.type === 'overage' && (
                <span className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                  Overage
                </span>
              )}
            </div>
            {invoice.description && (
              <p className='truncate text-[11px] text-muted-foreground'>{invoice.description}</p>
            )}
          </div>
          <div className='flex shrink-0 items-center gap-2'>
            <span className='font-medium text-[13px] tabular-nums'>
              {formatAmount(
                invoice.amountPaid > 0 ? invoice.amountPaid : invoice.amountDue,
                invoice.currency
              )}
            </span>
            {invoice.hostedInvoiceUrl && (
              <a
                href={invoice.hostedInvoiceUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground'
                aria-label='View invoice'
              >
                <ExternalLink className='h-3.5 w-3.5' />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
