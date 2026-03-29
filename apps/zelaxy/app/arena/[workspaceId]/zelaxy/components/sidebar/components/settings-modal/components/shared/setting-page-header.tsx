import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SettingPageHeaderProps {
  /** Page title */
  title: string
  /** Optional subtitle/description */
  description?: string
  /** Optional action element (button, etc.) rendered on the right */
  action?: ReactNode
  /** Additional className */
  className?: string
}

/**
 * Consistent header for each settings page/tab.
 * Clean typography with optional right-aligned action.
 */
export function SettingPageHeader({
  title,
  description,
  action,
  className,
}: SettingPageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 pb-1', className)}>
      <div className='min-w-0'>
        <h2 className='font-semibold text-foreground text-lg tracking-tight'>{title}</h2>
        {description && (
          <p className='mt-1 text-[13px] text-muted-foreground leading-relaxed'>{description}</p>
        )}
      </div>
      {action && <div className='shrink-0 pt-0.5'>{action}</div>}
    </div>
  )
}
