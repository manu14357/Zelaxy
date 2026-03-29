'use client'

import { cn } from '@/lib/utils'

interface DeployStatusProps {
  needsRedeployment: boolean
}

export function DeployStatus({ needsRedeployment }: DeployStatusProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-medium text-[12px] transition-colors',
        needsRedeployment
          ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-800/40'
          : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800/40'
      )}
    >
      <div className='relative flex items-center justify-center'>
        {needsRedeployment ? (
          <>
            <div className='absolute h-2 w-2 animate-ping rounded-full bg-amber-400/40' />
            <div className='relative h-1.5 w-1.5 rounded-full bg-amber-500' />
          </>
        ) : (
          <>
            <div className='absolute h-2 w-2 animate-ping rounded-full bg-emerald-400/40' />
            <div className='relative h-1.5 w-1.5 rounded-full bg-emerald-500' />
          </>
        )}
      </div>
      {needsRedeployment ? 'Changes Detected' : 'Live'}
    </div>
  )
}
