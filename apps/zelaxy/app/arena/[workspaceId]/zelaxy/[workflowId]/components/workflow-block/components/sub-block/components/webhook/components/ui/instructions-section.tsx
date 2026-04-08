import type React from 'react'
import { BookOpen, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InstructionsSectionProps {
  title?: string
  children: React.ReactNode
  tip?: string
  className?: string
}

export function InstructionsSection({
  title = 'Setup Instructions',
  children,
  tip,
  className,
}: InstructionsSectionProps) {
  return (
    <div
      className={cn(
        'mt-4 rounded-lg border border-border/60 bg-card/40 p-5 shadow-sm backdrop-blur-sm',
        className
      )}
    >
      <div className='mb-3 flex items-center gap-2'>
        <BookOpen className='h-4 w-4 text-primary' />
        <h4 className='font-semibold text-sm tracking-tight'>{title}</h4>
      </div>
      <div className='space-y-1.5 text-muted-foreground text-sm leading-relaxed [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-primary/80 [&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_li]:pl-1 [&_ol]:space-y-2'>
        {children}
      </div>
      {tip && (
        <div className='mt-4 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5'>
          <Lightbulb className='mt-0.5 h-3.5 w-3.5 shrink-0 text-primary' />
          <p className='text-muted-foreground text-xs leading-relaxed'>{tip}</p>
        </div>
      )}
    </div>
  )
}
