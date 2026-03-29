'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { CopyButton } from '@/components/ui/copy-button'
import { Label } from '@/components/ui/label'

interface ApiKeyProps {
  apiKey: string
  showLabel?: boolean
}

export function ApiKey({ apiKey, showLabel = true }: ApiKeyProps) {
  const [showKey, setShowKey] = useState(false)

  const maskApiKey = (key: string) => {
    if (!key || key.includes('No API key found')) return key
    if (key.length <= 11) return key
    return `${key.substring(0, 7)}${'*'.repeat(key.length - 11)}${key.substring(key.length - 4)}`
  }

  return (
    <div className='space-y-2'>
      {showLabel && (
        <Label className='font-medium text-[13px] text-foreground/70 uppercase tracking-wider'>
          API Key
        </Label>
      )}
      <div className='group relative overflow-hidden rounded-xl border border-border/50 bg-muted/30 transition-all duration-150 hover:border-border hover:bg-muted/50'>
        <pre
          className='cursor-pointer overflow-x-auto whitespace-pre-wrap p-3.5 pr-20 font-mono text-[13px] text-foreground/90 leading-relaxed'
          onClick={() => setShowKey(!showKey)}
          title={showKey ? 'Click to hide' : 'Click to reveal'}
        >
          {showKey ? apiKey : maskApiKey(apiKey)}
        </pre>
        <div className='-translate-y-1/2 absolute top-1/2 right-2 flex items-center gap-1'>
          <button
            onClick={() => setShowKey(!showKey)}
            className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground'
            title={showKey ? 'Hide key' : 'Reveal key'}
          >
            {showKey ? <EyeOff className='h-3.5 w-3.5' /> : <Eye className='h-3.5 w-3.5' />}
          </button>
          <CopyButton text={apiKey} />
        </div>
      </div>
    </div>
  )
}
