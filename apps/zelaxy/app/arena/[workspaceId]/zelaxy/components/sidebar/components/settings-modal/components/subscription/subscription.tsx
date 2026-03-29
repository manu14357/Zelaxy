import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CreditCard, Gauge, Users, Zap } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle, Button, Skeleton } from '@/components/ui'
import { useSession, useSubscription } from '@/lib/auth-client'
import { DEFAULT_FREE_CREDITS } from '@/lib/billing/constants'
import { createLogger } from '@/lib/logs/console/logger'
import {
  BillingSummary,
  CancelSubscription,
  TeamSeatsDialog,
  UsageLimitEditor,
} from '@/app/arena/[workspaceId]/zelaxy/components/sidebar/components/settings-modal/components/subscription/components'
import { useOrganizationStore } from '@/stores/organization'
import { useSubscriptionStore } from '@/stores/subscription/store'
import { SettingPageHeader, SettingRow, SettingSection } from '../shared'

const logger = createLogger('Subscription')

interface SubscriptionProps {
  onOpenChange?: (open: boolean) => void
}

export function Subscription({ onOpenChange }: SubscriptionProps) {
  const { data: session } = useSession()
  const betterAuthSubscription = useSubscription()

  const {
    isLoading,
    error,
    getSubscriptionStatus,
    getUsage,
    getBillingStatus,
    usageLimitData,
    subscriptionData,
  } = useSubscriptionStore()

  const {
    activeOrganization,
    organizationBillingData,
    isLoadingOrgBilling,
    loadOrganizationBillingData,
    getUserRole,
    addSeats,
  } = useOrganizationStore()

  const [isSeatsDialogOpen, setIsSeatsDialogOpen] = useState(false)
  const [isUpdatingSeats, setIsUpdatingSeats] = useState(false)

  const subscription = getSubscriptionStatus()
  const usage = getUsage()
  const billingStatus = getBillingStatus()
  const activeOrgId = activeOrganization?.id

  useEffect(() => {
    if (subscription.isTeam && activeOrgId) {
      loadOrganizationBillingData(activeOrgId)
    }
  }, [activeOrgId, subscription.isTeam])

  // Determine if user is team admin/owner
  const userRole = getUserRole(session?.user?.email)
  const isTeamAdmin = ['owner', 'admin'].includes(userRole)
  const shouldShowOrgBilling = subscription.isTeam && isTeamAdmin && organizationBillingData

  const handleUpgrade = useCallback(
    async (targetPlan: 'pro' | 'team') => {
      if (!session?.user?.id) return

      // Get current subscription data including stripeSubscriptionId
      const subscriptionData = useSubscriptionStore.getState().subscriptionData
      const currentSubscriptionId = subscriptionData?.stripeSubscriptionId

      let referenceId = session.user.id
      if (subscription.isTeam && activeOrgId) {
        referenceId = activeOrgId
      }

      const currentUrl = window.location.origin + window.location.pathname

      try {
        const upgradeParams: any = {
          plan: targetPlan,
          referenceId,
          successUrl: currentUrl,
          cancelUrl: currentUrl,
          seats: targetPlan === 'team' ? 1 : undefined,
        }

        // Add subscriptionId if we have an existing subscription to ensure proper plan switching
        if (currentSubscriptionId) {
          upgradeParams.subscriptionId = currentSubscriptionId
          logger.info('Upgrading existing subscription', {
            targetPlan,
            currentSubscriptionId,
            referenceId,
          })
        } else {
          logger.info('Creating new subscription (no existing subscription found)', {
            targetPlan,
            referenceId,
          })
        }

        await betterAuthSubscription.upgrade(upgradeParams)
      } catch (error) {
        logger.error('Failed to initiate subscription upgrade:', error)
        alert('Failed to initiate upgrade. Please try again or contact support.')
      }
    },
    [session?.user?.id, subscription.isTeam, activeOrgId, betterAuthSubscription]
  )

  const handleSeatsUpdate = useCallback(
    async (seats: number) => {
      if (!activeOrgId) {
        logger.error('No active organization found for seat update')
        return
      }

      try {
        setIsUpdatingSeats(true)
        await addSeats(seats)
        setIsSeatsDialogOpen(false)
      } catch (error) {
        logger.error('Failed to update seats:', error)
      } finally {
        setIsUpdatingSeats(false)
      }
    },
    [activeOrgId]
  )

  if (isLoading) {
    return (
      <div className='space-y-4 px-3 py-6'>
        <Skeleton className='h-5 w-40 rounded-md' />
        <Skeleton className='h-20 w-full rounded-xl' />
        <Skeleton className='h-16 w-full rounded-xl' />
      </div>
    )
  }

  if (error) {
    return (
      <div className='px-3 py-6'>
        <Alert variant='destructive' className='rounded-xl'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle className='font-semibold text-[13px]'>Error</AlertTitle>
          <AlertDescription className='text-[13px]'>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className='space-y-6 px-3 py-6'>
      <SettingPageHeader
        title='Subscription'
        description='Manage your plan, usage limits, and billing.'
      />

      {/* ── Current Plan & Usage ───────────────────────────────────── */}
      <SettingSection
        title='Current Plan'
        description='Your active subscription and usage overview.'
        icon={<CreditCard className='h-4 w-4' />}
      >
        <div className='space-y-0'>
          <SettingRow label='Plan' description={`You are on the ${subscription.plan} plan.`}>
            <div className='flex items-center gap-2'>
              <span className='rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-[12px] text-primary capitalize'>
                {subscription.plan}
              </span>
              {!subscription.isFree && <BillingSummary showDetails={false} />}
            </div>
          </SettingRow>

          <SettingRow
            label='Usage'
            description={`${usage.percentUsed}% of your limit used this period.`}
            bordered={false}
          >
            <span className='font-semibold text-[15px] text-foreground tabular-nums'>
              ${usage.current.toFixed(2)}{' '}
              <span className='font-normal text-[12px] text-muted-foreground'>
                / ${usage.limit}
              </span>
            </span>
          </SettingRow>
        </div>
      </SettingSection>

      {/* ── Usage Alerts ───────────────────────────────────────────── */}
      {billingStatus === 'exceeded' && (
        <Alert variant='destructive' className='rounded-xl'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle className='font-semibold text-[13px]'>Usage Limit Exceeded</AlertTitle>
          <AlertDescription className='text-[13px]'>
            You&apos;ve exceeded your usage limit of ${usage.limit}. Please upgrade your plan or
            increase your limit.
          </AlertDescription>
        </Alert>
      )}

      {billingStatus === 'warning' && (
        <Alert className='rounded-xl'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle className='font-semibold text-[13px]'>Approaching Usage Limit</AlertTitle>
          <AlertDescription className='text-[13px]'>
            You&apos;ve used {usage.percentUsed}% of your ${usage.limit} limit. Consider upgrading
            or increasing your limit.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Usage Limit ────────────────────────────────────────────── */}
      <SettingSection
        title='Usage Limit'
        description='Set your monthly spending cap.'
        icon={<Gauge className='h-4 w-4' />}
      >
        <SettingRow
          label={subscription.isTeam ? 'Individual Limit' : 'Monthly Limit'}
          bordered={false}
        >
          {isLoadingOrgBilling ? (
            <Skeleton className='h-8 w-16 rounded-lg' />
          ) : (
            <UsageLimitEditor
              currentLimit={usageLimitData?.currentLimit ?? usage.limit}
              canEdit={
                subscription.isPro ||
                subscription.isTeam ||
                subscription.isEnterprise ||
                (subscription.isTeam && isTeamAdmin)
              }
              minimumLimit={usageLimitData?.minimumLimit ?? DEFAULT_FREE_CREDITS}
            />
          )}
        </SettingRow>
        {subscription.isFree && (
          <p className='text-[12px] text-muted-foreground'>
            Upgrade to Pro ($20 minimum) or Team ($40 minimum) to customize your usage limit.
          </p>
        )}
        {subscription.isPro && (
          <p className='text-[12px] text-muted-foreground'>
            Pro plan minimum: $20. You can set your individual limit higher.
          </p>
        )}
        {subscription.isTeam && !isTeamAdmin && (
          <p className='text-[12px] text-muted-foreground'>
            Contact your team owner to adjust your limit. Team plan minimum: $40.
          </p>
        )}
        {subscription.isTeam && isTeamAdmin && (
          <p className='text-[12px] text-muted-foreground'>
            Team plan minimum: $40 per member. Manage team member limits in the Team tab.
          </p>
        )}
      </SettingSection>

      {/* ── Team Plan Details ──────────────────────────────────────── */}
      {subscription.isTeam && (
        <SettingSection
          title='Team Plan'
          description='Seats, billing, and team usage overview.'
          icon={<Users className='h-4 w-4' />}
        >
          {isLoadingOrgBilling ? (
            <div className='space-y-3 py-2'>
              <Skeleton className='h-4 w-full rounded-md' />
              <Skeleton className='h-4 w-3/4 rounded-md' />
              <Skeleton className='h-4 w-1/2 rounded-md' />
            </div>
          ) : shouldShowOrgBilling ? (
            <div className='space-y-0'>
              <SettingRow label='Licensed Seats'>
                <span className='font-semibold text-[13px] tabular-nums'>
                  {organizationBillingData.totalSeats} seats
                </span>
              </SettingRow>
              <SettingRow label='Monthly Bill'>
                <span className='font-semibold text-[13px] tabular-nums'>
                  ${organizationBillingData.totalSeats * 40}
                </span>
              </SettingRow>
              <SettingRow label='Current Usage' bordered={false}>
                <span className='font-semibold text-[13px] tabular-nums'>
                  ${organizationBillingData.totalCurrentUsage?.toFixed(2) || 0}
                </span>
              </SettingRow>
              <div className='mt-3 rounded-lg bg-muted/50 p-3 text-[12px] text-muted-foreground leading-relaxed'>
                You pay ${organizationBillingData.totalSeats * 40}/month for{' '}
                {organizationBillingData.totalSeats} licensed seats. If your team uses more, you'll
                be charged for the overage.
              </div>
            </div>
          ) : (
            <div className='space-y-0'>
              <SettingRow label='Your monthly allowance' bordered={false}>
                <span className='font-semibold text-[13px] tabular-nums'>${usage.limit}</span>
              </SettingRow>
              <p className='text-[12px] text-muted-foreground'>
                Contact your team owner to adjust your limit.
              </p>
            </div>
          )}
        </SettingSection>
      )}

      {/* ── Upgrade Actions ────────────────────────────────────────── */}
      {subscription.isFree && (
        <SettingSection
          title='Upgrade'
          description='Unlock more features and higher limits.'
          icon={<Zap className='h-4 w-4' />}
        >
          <div className='space-y-3 pt-1'>
            <Button
              onClick={() => handleUpgrade('pro')}
              className='h-9 w-full rounded-lg text-[13px]'
            >
              Upgrade to Pro — $20/month
            </Button>
            <Button
              onClick={() => handleUpgrade('team')}
              variant='outline'
              className='h-9 w-full rounded-lg text-[13px]'
            >
              Upgrade to Team — $40/seat/month
            </Button>
            <p className='text-center text-[12px] text-muted-foreground'>
              Need a custom plan?{' '}
              <a
                href='https://5fyxh22cfgi.typeform.com/to/EcJFBt9W'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary hover:underline'
              >
                Contact us
              </a>{' '}
              for Enterprise pricing.
            </p>
          </div>
        </SettingSection>
      )}

      {subscription.isPro && !subscription.isTeam && (
        <Button onClick={() => handleUpgrade('team')} className='h-9 w-full rounded-lg text-[13px]'>
          Upgrade to Team — $40/seat/month
        </Button>
      )}

      {subscription.isEnterprise && (
        <p className='py-2 text-center text-[13px] text-muted-foreground'>
          Enterprise plan — Contact support for changes.
        </p>
      )}

      {/* Cancel Subscription */}
      <CancelSubscription
        subscription={{
          plan: subscription.plan,
          status: subscription.status,
          isPaid: subscription.isPaid,
        }}
        subscriptionData={{
          periodEnd: subscriptionData?.periodEnd || null,
        }}
      />

      {/* Team Seats Dialog */}
      <TeamSeatsDialog
        open={isSeatsDialogOpen}
        onOpenChange={setIsSeatsDialogOpen}
        title='Update Team Seats'
        description='Each seat costs $40/month and provides $40 in monthly inference credits. Adjust the number of licensed seats for your team.'
        currentSeats={
          shouldShowOrgBilling ? organizationBillingData?.totalSeats || 1 : subscription.seats || 1
        }
        initialSeats={
          shouldShowOrgBilling ? organizationBillingData?.totalSeats || 1 : subscription.seats || 1
        }
        isLoading={isUpdatingSeats}
        onConfirm={handleSeatsUpdate}
        confirmButtonText='Update Seats'
        showCostBreakdown={true}
      />
    </div>
  )
}
