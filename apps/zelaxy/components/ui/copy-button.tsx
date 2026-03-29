'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CopyButtonProps {
  text: string
  className?: string
  showLabel?: boolean
}

export function CopyButton({ text, className = '', showLabel = true }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className='absolute top-2 right-2 flex items-center gap-1.5 opacity-0 transition-all duration-200 group-hover:opacity-100'>
      {showLabel && (
        <div className='rounded-md bg-background/90 px-2 py-0.5 font-medium text-[11px] text-muted-foreground shadow-sm ring-1 ring-border/50 backdrop-blur-sm'>
          {copied ? 'Copied!' : 'Copy'}
        </div>
      )}
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className={`h-7 w-7 rounded-lg bg-background/80 p-0 shadow-sm ring-1 ring-border/50 backdrop-blur-sm transition-all duration-150 hover:bg-background hover:ring-border active:scale-95 ${className}`}
        onClick={(e) => {
          e.stopPropagation()
          copyToClipboard()
        }}
        title='Copy to clipboard'
      >
        {copied ? (
          <Check className='h-3.5 w-3.5 text-emerald-500' />
        ) : (
          <Copy className='h-3.5 w-3.5 text-muted-foreground' />
        )}
      </Button>
    </div>
  )
}
