'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useSession } from '@/lib/auth-client'
import { openRazorpaySubscriptionCheckout } from '@/lib/billing/razorpay-checkout-client'
import { isRazorpaySubscriptionPlan } from '@/lib/billing/razorpay-pricing'
import { createLogger } from '@/lib/logs/console/logger'
import { useSubscriptionStore } from '@/stores/subscription/store'

const logger = createLogger('UpgradeIntentHandler')

/**
 * Completes a purchase started from the public pricing page.
 *
 * /checkout?plan=pro resolves auth server-side and forwards the surviving
 * intent here as ?upgrade=<plan>; this opens Razorpay Checkout for it on
 * arrival, so "Get Pro" while signed out becomes login -> payment rather
 * than login -> canvas with the intent silently lost.
 *
 * Mounted in the workspace layout rather than the store bootstrap because
 * /arena redirects to /arena/{id}/zelaxy - opening the widget mid-redirect
 * would tear it straight back down.
 */
export function UpgradeIntentHandler() {
  const { data: session } = useSession()
  // Strictly once per page load: the param is cleared immediately, but React
  // may still run this effect twice (StrictMode) before that lands.
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current || !session?.user?.id) return

    const url = new URL(window.location.href)
    const plan = url.searchParams.get('upgrade')
    if (!plan || !isRazorpaySubscriptionPlan(plan)) return

    handled.current = true

    // Drop the param before opening, so a refresh mid-payment doesn't reopen
    // a second checkout on top of the one already being resumed.
    url.searchParams.delete('upgrade')
    window.history.replaceState(null, '', url)

    const run = async () => {
      try {
        const result = await openRazorpaySubscriptionCheckout({
          plan,
          referenceId: session.user.id,
          prefillEmail: session.user.email,
          prefillName: session.user.name,
        })

        if (!result.success) {
          // Closing the widget is a normal choice, not an error worth a toast.
          if (result.dismissed) return
          logger.error('Upgrade from pricing page failed', { plan, error: result.error })
          toast.error(result.error || 'Could not start the upgrade', {
            action: result.hostedUrl
              ? {
                  label: 'Open payment page',
                  onClick: () => window.open(result.hostedUrl, '_blank', 'noopener'),
                }
              : undefined,
            duration: 10000,
          })
          return
        }

        await useSubscriptionStore.getState().refresh()
        toast.success(`You're on the ${plan === 'pro' ? 'Pro' : 'Team'} plan`, {
          description:
            result.mode === 'order'
              ? 'Paid for one month. Renew from Settings before it ends — this plan does not auto-renew.'
              : undefined,
        })
      } catch (error) {
        logger.error('Failed to open checkout from pricing intent', { error })
        toast.error('Could not start the upgrade. Please try again from Settings.')
      }
    }

    void run()
  }, [session?.user])

  return null
}
