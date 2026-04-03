import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { checkEnterprisePlan } from '@/lib/billing/subscriptions/utils'

type Subscription = {
  id: string
  plan: string
  status: string
  seats?: number
  referenceId: string
  cancelAtPeriodEnd?: boolean
  periodEnd?: number | Date
  trialEnd?: number | Date
  metadata?: any
}

interface TeamSeatsOverviewProps {
  subscriptionData: Subscription | null
  isLoadingSubscription: boolean
  usedSeats: number
  isLoading: boolean
  onConfirmTeamUpgrade: (seats: number) => Promise<void>
  onReduceSeats: () => Promise<void>
  onAddSeatDialog: () => void
}

function TeamSeatsSkeleton() {
  return (
    <div className='flex items-center space-x-2'>
      <Skeleton className='h-4 w-4 rounded-md' />
      <Skeleton className='h-4 w-32 rounded-md' />
    </div>
  )
}

export function TeamSeatsOverview({
  subscriptionData,
  isLoadingSubscription,
  usedSeats,
  isLoading,
  onConfirmTeamUpgrade,
  onReduceSeats,
  onAddSeatDialog,
}: TeamSeatsOverviewProps) {
  if (isLoadingSubscription) {
    return (
      <div className='rounded-xl border border-border/60 bg-card/50'>
        <div className='px-3 pt-3 pb-1 sm:px-4 sm:pt-4'>
          <h3 className='font-semibold text-[13px] text-foreground tracking-tight'>
            Team Seats Overview
          </h3>
          <p className='mt-0.5 text-[12px] text-muted-foreground leading-snug'>
            Manage your team&apos;s seat allocation and billing
          </p>
        </div>
        <div className='px-3 pt-3 pb-3 sm:px-4 sm:pb-4'>
          <TeamSeatsSkeleton />
        </div>
      </div>
    )
  }

  if (!subscriptionData) {
    return (
      <div className='rounded-xl border border-border/60 bg-card/50'>
        <div className='px-3 pt-3 pb-1 sm:px-4 sm:pt-4'>
          <h3 className='font-semibold text-[13px] text-foreground tracking-tight'>
            Team Seats Overview
          </h3>
          <p className='mt-0.5 text-[12px] text-muted-foreground leading-snug'>
            Manage your team&apos;s seat allocation and billing
          </p>
        </div>
        <div className='px-3 pt-3 pb-3 sm:px-4 sm:pb-4'>
          <div className='space-y-4 py-4 text-center'>
            <div className='mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-100/80 dark:bg-amber-900/30'>
              <Building2 className='h-5 w-5 text-amber-600 dark:text-amber-400' />
            </div>
            <div className='space-y-1'>
              <p className='font-medium text-[13px] text-foreground'>No Team Subscription Found</p>
              <p className='text-[12px] text-muted-foreground'>
                Your subscription may need to be transferred to this organization.
              </p>
            </div>
            <Button
              onClick={() => onConfirmTeamUpgrade(2)}
              disabled={isLoading}
              size='sm'
              className='h-8 rounded-lg text-[13px]'
            >
              Set Up Team Subscription
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='rounded-xl border border-border/60 bg-card/50'>
      <div className='px-3 pt-3 pb-1 sm:px-4 sm:pt-4'>
        <h3 className='font-semibold text-[13px] text-foreground tracking-tight'>
          Team Seats Overview
        </h3>
        <p className='mt-0.5 text-[12px] text-muted-foreground leading-snug'>
          Manage your team&apos;s seat allocation and billing
        </p>
      </div>
      <div className='space-y-3 px-3 pt-3 pb-3 sm:space-y-4 sm:px-4 sm:pb-4'>
        <div className='grid grid-cols-3 gap-2 text-center sm:gap-3'>
          <div className='rounded-lg bg-muted/40 p-3'>
            <p className='font-bold text-foreground text-lg tabular-nums'>
              {subscriptionData.seats || 0}
            </p>
            <p className='font-medium text-[11px] text-muted-foreground uppercase tracking-wider'>
              Licensed
            </p>
          </div>
          <div className='rounded-lg bg-muted/40 p-3'>
            <p className='font-bold text-foreground text-lg tabular-nums'>{usedSeats}</p>
            <p className='font-medium text-[11px] text-muted-foreground uppercase tracking-wider'>
              Used
            </p>
          </div>
          <div className='rounded-lg bg-muted/40 p-3'>
            <p className='font-bold text-foreground text-lg tabular-nums'>
              {(subscriptionData.seats || 0) - usedSeats}
            </p>
            <p className='font-medium text-[11px] text-muted-foreground uppercase tracking-wider'>
              Available
            </p>
          </div>
        </div>

        <div className='space-y-1.5'>
          <div className='flex justify-between text-[12px]'>
            <span className='text-muted-foreground'>Seat Usage</span>
            <span className='font-medium text-foreground tabular-nums'>
              {usedSeats} of {subscriptionData.seats || 0} seats
            </span>
          </div>
          <Progress value={(usedSeats / (subscriptionData.seats || 1)) * 100} className='h-2' />
        </div>

        <div className='flex items-center justify-between border-border/40 border-t pt-3 text-[12px]'>
          <span className='text-muted-foreground'>Seat Cost:</span>
          <span className='font-semibold text-foreground tabular-nums'>
            ${((subscriptionData.seats || 0) * 40).toFixed(2)}
          </span>
        </div>
        <p className='text-[11px] text-muted-foreground'>
          Individual usage limits may vary. See Subscription tab for team totals.
        </p>

        {checkEnterprisePlan(subscriptionData) ? (
          <div className='rounded-lg bg-primary/10 p-3 text-center dark:bg-primary/15'>
            <p className='font-medium text-[12px] text-primary dark:text-primary/70'>
              Enterprise Plan
            </p>
            <p className='mt-0.5 text-[11px] text-primary dark:text-primary/80'>
              Contact support to modify seats
            </p>
          </div>
        ) : (
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={onReduceSeats}
              disabled={(subscriptionData.seats || 0) <= 1 || isLoading}
              className='h-8 flex-1 rounded-lg text-[13px]'
            >
              Remove Seat
            </Button>
            <Button
              size='sm'
              onClick={onAddSeatDialog}
              disabled={isLoading}
              className='h-8 flex-1 rounded-lg text-[13px]'
            >
              Add Seat
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
