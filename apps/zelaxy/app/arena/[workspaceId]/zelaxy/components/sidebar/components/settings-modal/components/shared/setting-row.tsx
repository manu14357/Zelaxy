import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SettingRowProps {
  /** Primary label for the setting */
  label: string
  /** Optional description shown below the label */
  description?: string
  /** The control element (Switch, Select, Button, etc.) */
  children: ReactNode
  /** Whether this row has a bottom border separator */
  bordered?: boolean
  /** Additional className for the row */
  className?: string
  /** HTML id for accessibility linking with the control */
  htmlFor?: string
}

/**
 * A single setting row — label + description on the left, control on the right.
 * Uses Apple Settings-style layout with clean typography and minimal chrome.
 */
export function SettingRow({
  label,
  description,
  children,
  bordered = true,
  className,
  htmlFor,
}: SettingRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 py-3',
        bordered && 'border-border/40 border-b last:border-b-0',
        className
      )}
    >
      <div className='min-w-0 flex-1'>
        <label
          htmlFor={htmlFor}
          className='cursor-pointer select-none font-medium text-[13px] text-foreground'
        >
          {label}
        </label>
        {description && (
          <p className='mt-0.5 text-[12px] text-muted-foreground leading-snug'>{description}</p>
        )}
      </div>
      <div className='shrink-0'>{children}</div>
    </div>
  )
}
