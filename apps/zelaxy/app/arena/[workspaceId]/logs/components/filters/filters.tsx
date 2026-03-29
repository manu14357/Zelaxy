'use client'

import { TimerOff } from 'lucide-react'
import { Button } from '@/components/ui'
import { isProd } from '@/lib/environment'
import {
  FilterSection,
  FolderFilter,
  Level,
  Timeline,
  Trigger,
  Workflow,
} from '@/app/arena/[workspaceId]/logs/components/filters/components'
import { useSubscriptionStore } from '@/stores/subscription/store'

/**
 * Filters component for logs page - includes timeline and other filter options
 */
export function Filters() {
  const { getSubscriptionStatus, isLoading } = useSubscriptionStore()
  const subscription = getSubscriptionStatus()
  const isPaid = subscription.isPaid

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const event = new CustomEvent('open-settings', {
      detail: { tab: 'subscription' },
    })
    window.dispatchEvent(event)
  }

  return (
    <div className='h-full w-60 overflow-auto p-4'>
      {/* Show retention policy for free users in production only */}
      {!isLoading && !isPaid && isProd && (
        <div className='mb-4 overflow-hidden rounded-xl border border-border/40'>
          <div className='flex items-center gap-2 border-border/40 border-b bg-muted/20 px-3 py-2.5'>
            <TimerOff className='h-3.5 w-3.5 text-muted-foreground' />
            <span className='font-medium text-[12px]'>Log Retention Policy</span>
          </div>
          <div className='p-3'>
            <p className='text-[11px] text-muted-foreground leading-relaxed'>
              Logs are automatically deleted after 7 days.
            </p>
            <div className='mt-2'>
              <Button
                size='sm'
                variant='secondary'
                className='h-7 w-full rounded-lg text-[11px]'
                onClick={handleUpgradeClick}
              >
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>
      )}

      <h2 className='mb-3 pl-1 font-medium text-[11px] text-muted-foreground/70 uppercase tracking-wider'>
        Filters
      </h2>

      {/* Timeline Filter */}
      <FilterSection title='Timeline' content={<Timeline />} />

      {/* Level Filter */}
      <FilterSection title='Level' content={<Level />} />

      {/* Trigger Filter */}
      <FilterSection title='Trigger' content={<Trigger />} />

      {/* Folder Filter */}
      <FilterSection title='Folder' content={<FolderFilter />} />

      {/* Workflow Filter */}
      <FilterSection title='Workflow' content={<Workflow />} />
    </div>
  )
}
