'use client'

import { CopyButton } from '@/components/ui/copy-button'
import { Label } from '@/components/ui/label'

interface ApiEndpointProps {
  endpoint: string
  showLabel?: boolean
}

export function ApiEndpoint({ endpoint, showLabel = true }: ApiEndpointProps) {
  return (
    <div className='space-y-2'>
      {showLabel && (
        <Label className='font-medium text-[13px] text-foreground/70 uppercase tracking-wider'>
          Endpoint
        </Label>
      )}
      <div className='group relative overflow-hidden rounded-xl border border-border/50 bg-muted/30 transition-all duration-150 hover:border-border hover:bg-muted/50'>
        <pre className='overflow-x-auto whitespace-pre-wrap p-3.5 font-mono text-[13px] text-foreground/90 leading-relaxed'>
          {endpoint}
        </pre>
        <CopyButton text={endpoint} />
      </div>
    </div>
  )
}
