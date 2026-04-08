import type React from 'react'
import { cn } from '@/lib/utils'

interface ConfigSectionProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function ConfigSection({ title, children, className }: ConfigSectionProps) {
  return (
    <div
      className={cn(
        'space-y-4 rounded-lg border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur-sm',
        className
      )}
    >
      {title && <h4 className='font-semibold text-foreground text-sm tracking-tight'>{title}</h4>}
      {children}
    </div>
  )
}
