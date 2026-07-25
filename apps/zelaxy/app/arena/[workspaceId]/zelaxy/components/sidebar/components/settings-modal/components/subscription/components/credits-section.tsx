import { useEffect, useState } from 'react'
import { Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { createLogger } from '@/lib/logs/console/logger'
import { BuyCreditsDialog } from './buy-credits-dialog'

const logger = createLogger('CreditsSection')

/**
 * Prepaid credit balance + entry point to buy more. Credits are applied
 * automatically to overage charges before a Razorpay payment link is issued
 * (see lib/billing/credits/*) - this just surfaces the current balance and
 * lets the user top it up.
 */
export function CreditsSection() {
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadBalance() {
      setIsLoading(true)
      try {
        const response = await fetch('/api/billing/credits/balance')
        if (!response.ok) throw new Error('Failed to load credit balance')

        const { balance: fetchedBalance } = await response.json()
        if (!cancelled) setBalance(fetchedBalance)
      } catch (err) {
        logger.error('Failed to load credit balance', { error: err })
        if (!cancelled) setBalance(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadBalance()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <p className='text-[12px] text-muted-foreground'>Available balance</p>
          {isLoading ? (
            <Skeleton className='mt-1 h-6 w-16 rounded-md' />
          ) : (
            <span className='font-semibold text-[18px] text-foreground tabular-nums'>
              ${(balance ?? 0).toFixed(2)}
            </span>
          )}
        </div>
        <Button
          variant='outline'
          size='sm'
          className='h-8 rounded-lg text-[13px]'
          onClick={() => setIsDialogOpen(true)}
        >
          <Wallet className='mr-1.5 h-3.5 w-3.5' />
          Buy Credits
        </Button>
      </div>
      <p className='mt-2 text-[12px] text-muted-foreground'>
        Credits are applied automatically to usage overage before your card is charged.
      </p>

      <BuyCreditsDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            // Refresh balance in case a purchase completed while the dialog was open
            // (e.g. returning from Checkout in the same tab/back button).
            fetch('/api/billing/credits/balance')
              .then((r) => r.json())
              .then(({ balance: refreshed }) => setBalance(refreshed))
              .catch(() => {})
          }
        }}
      />
    </>
  )
}
