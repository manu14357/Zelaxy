'use client'

import { useState } from 'react'
import { Check, Copy, FileText, LibraryBig } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface BaseOverviewProps {
  id?: string
  title: string
  docCount: number
  description: string
}

export function BaseOverview({ id, title, docCount, description }: BaseOverviewProps) {
  const [isCopied, setIsCopied] = useState(false)
  const params = useParams()
  const workspaceId = params?.workspaceId as string

  // Create URL with knowledge base name as query parameter
  const searchParams = new URLSearchParams({
    kbName: title,
  })
  const href = `/arena/${workspaceId}/knowledge/${id || title.toLowerCase().replace(/\s+/g, '-')}?${searchParams.toString()}`

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (id) {
      try {
        await navigator.clipboard.writeText(id)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy ID:', err)
      }
    }
  }

  return (
    <Link href={href} prefetch={true}>
      <div className='group relative flex cursor-pointer flex-col rounded-xl border border-border/40 bg-card/50 p-4 transition-all duration-200 hover:border-border/70 hover:bg-card/80 hover:shadow-md'>
        {/* Header */}
        <div className='mb-3 flex items-start gap-3'>
          <div className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors duration-200 group-hover:bg-primary/15'>
            <LibraryBig className='h-4 w-4 text-primary' />
          </div>
          <div className='min-w-0 flex-1'>
            <h3 className='truncate font-semibold text-[13px] text-foreground leading-tight'>
              {title}
            </h3>
            <div className='mt-1 flex items-center gap-1.5'>
              <FileText className='h-3 w-3 text-muted-foreground/60' />
              <span className='text-[11px] text-muted-foreground'>
                {docCount} {docCount === 1 ? 'document' : 'documents'}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className='mb-3 line-clamp-2 text-[12px] text-muted-foreground/80 leading-relaxed'>
          {description}
        </p>

        {/* Footer */}
        <div className='mt-auto flex items-center justify-between border-border/30 border-t pt-3'>
          <span className='truncate font-mono text-[10px] text-muted-foreground/50'>
            {id?.slice(0, 8)}
          </span>
          <button
            onClick={handleCopy}
            className='flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/40 transition-all duration-150 hover:bg-muted/50 hover:text-foreground'
            title='Copy ID'
          >
            {isCopied ? (
              <Check className='h-3 w-3 text-emerald-500' />
            ) : (
              <Copy className='h-3 w-3' />
            )}
          </button>
        </div>
      </div>
    </Link>
  )
}
