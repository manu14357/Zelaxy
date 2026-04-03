import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SettingSectionProps {
  /** Section title displayed as a heading */
  title: string
  /** Optional subtitle/description below the title */
  description?: string
  /** Optional icon displayed before the title */
  icon?: ReactNode
  /** The section content (SettingRows, buttons, etc.) */
  children: ReactNode
  /** Additional className for the outer wrapper */
  className?: string
}

/**
 * A visually distinct settings section with a title, optional description,
 * and content area. Follows Apple/Vercel design language — clean borders,
 * generous whitespace, subtle backgrounds.
 */
export function SettingSection({
  title,
  description,
  icon,
  children,
  className,
}: SettingSectionProps) {
  return (
    <div className={cn('rounded-xl border border-border/60 bg-card/50', className)}>
      <div className='px-3 pt-4 pb-1 sm:px-5 sm:pt-5'>
        <div className='flex items-center gap-2.5'>
          {icon && (
            <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground'>
              {icon}
            </span>
          )}
          <div className='min-w-0'>
            <h3 className='font-semibold text-[13px] text-foreground tracking-tight'>{title}</h3>
            {description && (
              <p className='mt-0.5 text-[12px] text-muted-foreground leading-snug'>{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className='px-3 pt-3 pb-4 sm:px-5'>{children}</div>
    </div>
  )
}
