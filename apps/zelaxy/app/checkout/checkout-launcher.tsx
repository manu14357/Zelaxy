'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LoadingAgent } from '@/components/ui/loading-agent'
import { openRazorpaySubscriptionCheckout } from '@/lib/billing/razorpay-checkout-client'
import type { RazorpaySubscriptionPlan } from '@/lib/billing/razorpay-pricing'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('CheckoutLauncher')

interface CheckoutLauncherProps {
  plan: RazorpaySubscriptionPlan
  email?: string
  name?: string
}

/**
 * Opens Razorpay Checkout for a purchase started on the pricing page, and
 * only enters the app once it settles.
 *
 * Deliberately does this on /checkout rather than forwarding the intent into
 * the arena: landing in the app means /arena redirects to
 * /arena/{id}/zelaxy, which then asynchronously loads workflows and
 * redirects again to /arena/{id}/zelaxy/{workflowId}. That last hop lands
 * after the workflow fetch resolves - reliably later than the widget opens -
 * and tearing down the page takes the payment iframe with it, which is
 * exactly the blank "broken document" on a first attempt that a reload then
 * appeared to fix. This page never redirects on its own, so there is nothing
 * to race.
 */
export function CheckoutLauncher({ plan, email, name }: CheckoutLauncherProps) {
  const router = useRouter()
  const started = useRef(false)
  const [status, setStatus] = useState<'opening' | 'done'>('opening')

  useEffect(() => {
    if (started.current) return
    started.current = true

    const run = async () => {
      try {
        const result = await openRazorpaySubscriptionCheckout({
          plan,
          prefillEmail: email,
          prefillName: name,
        })

        if (result.success) {
          toast.success(`You're on the ${plan === 'pro' ? 'Pro' : 'Team'} plan`, {
            description:
              result.mode === 'order'
                ? 'Paid for one month. Renew from Settings before it ends — this plan does not auto-renew.'
                : undefined,
          })
        } else if (!result.dismissed) {
          logger.error('Checkout from pricing page failed', { plan, error: result.error })
          toast.error(result.error || 'Could not complete the upgrade', {
            action: result.hostedUrl
              ? {
                  label: 'Open payment page',
                  onClick: () => window.open(result.hostedUrl, '_blank', 'noopener'),
                }
              : undefined,
            duration: 10000,
          })
        }
      } catch (error) {
        logger.error('Failed to open checkout', { error })
        toast.error('Could not start the upgrade. Please try again from Settings.')
      } finally {
        // Into the app either way - a closed or failed checkout shouldn't
        // strand anyone on a blank page. The plan is reconciled on load.
        setStatus('done')
        router.replace('/arena')
      }
    }

    void run()
  }, [plan, email, name, router])

  return (
    <div className='flex h-screen w-full items-center justify-center'>
      <div className='flex flex-col items-center gap-4 text-center'>
        <LoadingAgent size='lg' />
        <p className='text-muted-foreground text-sm'>
          {status === 'opening' ? 'Opening secure checkout…' : 'Taking you to your workspace…'}
        </p>
      </div>
    </div>
  )
}
