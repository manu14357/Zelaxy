import type React from 'react'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface ConfigFieldProps {
  id: string
  label: React.ReactNode
  description?: string
  children: React.ReactNode
  className?: string
}

export function ConfigField({ id, label, description, children, className }: ConfigFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className='flex items-center gap-1.5'>
        <Label htmlFor={id} className='font-medium text-sm'>
          {label}
        </Label>
        {description && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='h-5 w-5 p-0.5 text-muted-foreground hover:text-foreground'
                aria-label={`Learn more about ${label?.toString() || id}`}
              >
                <Info className='h-3.5 w-3.5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side='right'
              align='center'
              className='z-[100] max-w-[300px] p-3'
              role='tooltip'
            >
              <p className='text-sm leading-relaxed'>{description}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {children}
    </div>
  )
}
