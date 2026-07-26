'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Building2,
  Check,
  Clock,
  Database,
  HeadphonesIcon,
  Infinity as InfinityIcon,
  MessageSquare,
  Server,
  Users,
  Workflow,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth-client'
import {
  CLOSE_OVERLAYS_EVENT,
  openRazorpaySubscriptionCheckout,
} from '@/lib/billing/razorpay-checkout-client'
import { RAZORPAY_PLAN_PRICING } from '@/lib/billing/razorpay-pricing'
import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'
import { useOrganizationStore } from '@/stores/organization'
import { useSubscriptionStore } from '@/stores/subscription/store'

const logger = createLogger('SubscriptionModal')

interface SubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PlanFeature {
  text: string
  included: boolean
  icon?: any
}

export function SubscriptionModal({ open, onOpenChange }: SubscriptionModalProps) {
  const { data: session } = useSession()
  const { activeOrganization } = useOrganizationStore()
  const { loadData, refresh, getSubscriptionStatus } = useSubscriptionStore()
  const [upgradingPlan, setUpgradingPlan] = useState<'pro' | 'team' | null>(null)

  // Load subscription data when modal opens
  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, loadData])

  // Step aside for Razorpay Checkout - its iframe mounts on <body>, outside
  // this dialog, where Radix's modal mode would block clicks and focus.
  useEffect(() => {
    const closeForCheckout = () => onOpenChange(false)
    window.addEventListener(CLOSE_OVERLAYS_EVENT, closeForCheckout)
    return () => window.removeEventListener(CLOSE_OVERLAYS_EVENT, closeForCheckout)
  }, [onOpenChange])

  const subscription = getSubscriptionStatus()

  const handleUpgrade = useCallback(
    async (targetPlan: 'pro' | 'team') => {
      if (!session?.user?.id) return

      let referenceId = session.user.id
      if (subscription.isTeam && activeOrganization?.id) {
        referenceId = activeOrganization.id
      }

      setUpgradingPlan(targetPlan)
      try {
        const result = await openRazorpaySubscriptionCheckout({
          plan: targetPlan,
          referenceId,
          seats: targetPlan === 'team' ? 1 : undefined,
          prefillEmail: session.user.email,
          prefillName: session.user.name,
        })

        if (!result.success) {
          // Closing the widget without paying is normal, not an error.
          if (result.dismissed) return
          logger.error('Failed to complete subscription upgrade:', result.error)
          toast.error(result.error || 'Could not complete the upgrade', {
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

        // refresh(), not loadData() - the plan just changed, and loadData
        // would hand back the pre-upgrade data still sitting in the 30s cache.
        await refresh()
        onOpenChange(false)
        toast.success(`You're on the ${targetPlan === 'pro' ? 'Pro' : 'Team'} plan`)
      } catch (error) {
        logger.error('Failed to initiate subscription upgrade:', error)
        toast.error('Failed to start the upgrade. Please try again or contact support.')
      } finally {
        setUpgradingPlan(null)
      }
    },
    [session?.user, subscription.isTeam, activeOrganization?.id, refresh, onOpenChange]
  )

  const handleContactUs = () => {
    window.open('https://form.typeform.com/to/jqCO12pF', '_blank')
  }

  // Prices are derived from RAZORPAY_PLAN_PRICING (the same INR amounts
  // Razorpay actually charges via the subscription mandate) instead of
  // being hand-typed here, so this copy can't silently drift from what's
  // actually charged. No Free plan - it isn't a purchasable subscription.
  const plans = [
    {
      name: 'Pro',
      price: `₹${RAZORPAY_PLAN_PRICING.pro.priceInr}`,
      description: RAZORPAY_PLAN_PRICING.pro.period,
      features: [
        { text: '25 runs per minute (sync)', included: true, icon: Zap },
        { text: '200 runs per minute (async)', included: true, icon: Clock },
        { text: 'Unlimited workspaces', included: true, icon: Building2 },
        { text: 'Unlimited workflows', included: true, icon: Workflow },
        { text: 'Unlimited invites', included: true, icon: Users },
        { text: 'Unlimited log retention', included: true, icon: Database },
      ] as PlanFeature[],
      isActive: subscription.isPro && !subscription.isTeam,
      action: !subscription.isPro && !subscription.isTeam ? () => handleUpgrade('pro') : null,
      isLoading: upgradingPlan === 'pro',
    },
    {
      name: 'Team',
      price: `₹${RAZORPAY_PLAN_PRICING.team.priceInr}`,
      description: RAZORPAY_PLAN_PRICING.team.period,
      features: [
        { text: '75 runs per minute (sync)', included: true, icon: Zap },
        { text: '500 runs per minute (async)', included: true, icon: Clock },
        { text: 'Everything in Pro', included: true, icon: InfinityIcon },
        { text: 'Dedicated Slack channel', included: true, icon: MessageSquare },
      ] as PlanFeature[],
      isActive: subscription.isTeam,
      action: !subscription.isTeam ? () => handleUpgrade('team') : null,
      isLoading: upgradingPlan === 'team',
    },
  ]

  const enterprisePlan = {
    name: 'Enterprise',
    features: [
      { text: 'Custom rate limits', included: true, icon: Zap },
      { text: 'Enterprise hosting license', included: true, icon: Server },
      { text: 'Custom enterprise support', included: true, icon: HeadphonesIcon },
    ] as PlanFeature[],
    isActive: subscription.isEnterprise,
    action: handleContactUs,
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='!fixed !inset-0 !m-0 data-[state=open]:!translate-x-0 data-[state=open]:!translate-y-0 flex h-full max-h-full w-full max-w-full flex-col gap-0 rounded-none border-0 p-0'>
        <AlertDialogHeader className='flex-shrink-0 px-6 py-5'>
          <AlertDialogTitle className='font-medium text-lg'>Upgrade your plan</AlertDialogTitle>
        </AlertDialogHeader>

        <div className='flex min-h-0 flex-1 items-center justify-center overflow-hidden px-8 pb-8'>
          <div className='flex w-full max-w-3xl flex-col gap-6'>
            {/* Main Plans Grid - Pro, Team */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={cn('relative flex flex-col rounded-[10px] border p-6')}
                >
                  {/* Plan Header */}
                  <div className='mb-6'>
                    <h3 className='mb-3 font-semibold text-lg'>{plan.name}</h3>
                    <div className='flex items-baseline'>
                      <span className='font-semibold text-3xl'>{plan.price}</span>
                      {plan.description && (
                        <span className='ml-1 text-muted-foreground text-sm'>
                          {plan.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className='mb-6 flex-1 space-y-3'>
                    {plan.features.map((feature, index) => (
                      <li key={index} className='flex items-start gap-2 text-sm'>
                        {feature.icon ? (
                          <feature.icon className='mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground' />
                        ) : (
                          <Check className='mt-0.5 h-4 w-4 flex-shrink-0 text-green-500' />
                        )}
                        <span className='text-muted-foreground'>{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <div className='mt-auto'>
                    {plan.isActive ? (
                      <Button variant='secondary' className='w-full rounded-[8px]' disabled>
                        Current plan
                      </Button>
                    ) : plan.action ? (
                      <Button
                        onClick={plan.action}
                        className='w-full rounded-[8px]'
                        variant='default'
                        disabled={plan.isLoading}
                      >
                        {plan.isLoading ? 'Opening checkout…' : 'Upgrade'}
                      </Button>
                    ) : (
                      <Button variant='outline' className='w-full rounded-[8px]' disabled>
                        Upgrade
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Enterprise Plan - Full Width */}
            <div
              className={cn(
                'relative flex flex-col rounded-[10px] border p-6 md:flex-row md:items-center md:justify-between',
                enterprisePlan.isActive && 'border-gray-400'
              )}
            >
              {/* Left Side - Plan Info */}
              <div className='mb-4 md:mb-0'>
                <h3 className='mb-2 font-semibold text-lg'>{enterprisePlan.name}</h3>
                <p className='mb-3 text-muted-foreground text-sm'>
                  Custom solutions tailored to your enterprise needs
                </p>
                <div className='flex items-center gap-4'>
                  {enterprisePlan.features.map((feature, index) => (
                    <div key={index} className='flex items-center gap-4'>
                      <div className='flex items-center gap-2 text-sm'>
                        {feature.icon ? (
                          <feature.icon className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
                        ) : (
                          <Check className='h-4 w-4 flex-shrink-0 text-green-500' />
                        )}
                        <span className='text-muted-foreground'>{feature.text}</span>
                      </div>
                      {index < enterprisePlan.features.length - 1 && (
                        <div className='h-4 w-px bg-border' />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side - Button */}
              <div className='md:ml-auto md:w-[200px]'>
                {enterprisePlan.isActive ? (
                  <Button variant='secondary' className='w-full rounded-[8px]' disabled>
                    Current plan
                  </Button>
                ) : (
                  <Button
                    onClick={enterprisePlan.action}
                    className='w-full rounded-[8px]'
                    variant='default'
                  >
                    Contact us
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
