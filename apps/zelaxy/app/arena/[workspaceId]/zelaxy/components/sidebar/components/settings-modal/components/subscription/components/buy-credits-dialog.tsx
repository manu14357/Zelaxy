import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSession } from '@/lib/auth-client'
import { openRazorpayCreditPurchaseCheckout } from '@/lib/billing/razorpay-checkout-client'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('BuyCreditsDialog')

const MIN_CREDIT_PURCHASE = 100
const MAX_CREDIT_PURCHASE = 50000
const PRESET_AMOUNTS = [500, 1000, 2500, 5000]

interface BuyCreditsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Starts a one-time Razorpay Checkout for prepaid usage credits. The
 * balance itself is only credited once Razorpay confirms payment via the
 * payment.captured webhook, not synchronously here - the dialog just opens
 * the Checkout widget and reports whether the payment itself succeeded.
 */
export function BuyCreditsDialog({ open, onOpenChange }: BuyCreditsDialogProps) {
  const { data: session } = useSession()
  const [amount, setAmount] = useState(500)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValidAmount = amount >= MIN_CREDIT_PURCHASE && amount <= MAX_CREDIT_PURCHASE

  const handlePurchase = async () => {
    if (!isValidAmount) return

    setIsLoading(true)
    setError(null)
    try {
      const result = await openRazorpayCreditPurchaseCheckout({
        amountRupees: amount,
        prefillEmail: session?.user?.email,
        prefillName: session?.user?.name,
      })

      if (!result.success) {
        if (result.error && !result.error.includes('closed')) {
          setError(result.error)
        }
        return
      }

      onOpenChange(false)
    } catch (err) {
      logger.error('Failed to start credit purchase', { error: err })
      setError(err instanceof Error ? err.message : 'Failed to start credit purchase')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buy Credits</DialogTitle>
          <DialogDescription>
            Prepaid credits are applied automatically to future usage charges before your card is
            billed.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          <div className='flex flex-wrap gap-2'>
            {PRESET_AMOUNTS.map((preset) => (
              <Button
                key={preset}
                type='button'
                variant={amount === preset ? 'default' : 'outline'}
                size='sm'
                className='h-8 rounded-lg text-[13px]'
                onClick={() => setAmount(preset)}
              >
                ₹{preset}
              </Button>
            ))}
          </div>

          <div>
            <Label htmlFor='credit-amount'>Amount (INR)</Label>
            <Input
              id='credit-amount'
              type='number'
              min={MIN_CREDIT_PURCHASE}
              max={MAX_CREDIT_PURCHASE}
              value={amount}
              onChange={(e) => setAmount(Number.parseFloat(e.target.value) || 0)}
              className='mt-1'
            />
            <p className='mt-1 text-[12px] text-muted-foreground'>
              Between ₹{MIN_CREDIT_PURCHASE} and ₹{MAX_CREDIT_PURCHASE}.
            </p>
          </div>

          {error && <p className='text-[12px] text-destructive'>{error}</p>}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handlePurchase} disabled={isLoading || !isValidAmount}>
            {isLoading ? (
              <div className='flex items-center space-x-2'>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-b-transparent' />
                <span>Opening checkout…</span>
              </div>
            ) : (
              <span>Continue to payment</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
