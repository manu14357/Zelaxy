'use client'

import { File as FileIcon, FileText, Loader2, Music, Play, X } from 'lucide-react'

/** Lightweight, display-only attachment metadata carried on a chat message. `previewUrl` is a live
 * object URL (valid for the session only — not persisted, so reloaded history shows a file chip). */
export interface MessageAttachment {
  id: string
  name: string
  type: string
  size?: number
  previewUrl?: string
}

function pickIcon(type: string, name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (type.startsWith('audio/')) return Music
  if (type.startsWith('video/')) return Play
  if (type === 'application/pdf' || ext === 'pdf') return FileText
  if (type.includes('word') || ext === 'doc' || ext === 'docx') return FileText
  if (type.includes('sheet') || ext === 'xls' || ext === 'xlsx' || ext === 'csv') return FileText
  return FileIcon
}

function formatSize(bytes?: number) {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** A single attachment rendered as an image thumbnail (image/*) or an icon+name+size file chip.
 * Reused for the pending chips above the composer and inside a sent user message. */
export function AttachmentPreview({
  name,
  type,
  size,
  previewUrl,
  uploading = false,
  onRemove,
}: {
  name: string
  type: string
  size?: number
  previewUrl?: string
  uploading?: boolean
  onRemove?: () => void
}) {
  const isImage = type.startsWith('image/')
  const Icon = pickIcon(type, name)
  const sub = formatSize(size) || type.split('/')[1]?.toUpperCase() || 'FILE'

  return (
    <div className='group relative'>
      {isImage && previewUrl ? (
        <div className='h-14 w-14 overflow-hidden rounded-lg border border-border/50 bg-card'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={name} className='h-full w-full object-cover' />
          {uploading && (
            <div className='absolute inset-0 flex items-center justify-center bg-black/40'>
              <Loader2 className='h-4 w-4 animate-spin text-white' />
            </div>
          )}
        </div>
      ) : (
        <div className='flex h-14 w-[180px] items-center gap-2.5 rounded-lg border border-border/50 bg-card px-2.5'>
          <div className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10'>
            {uploading ? (
              <Loader2 className='h-4 w-4 animate-spin text-primary' />
            ) : (
              <Icon className='h-[18px] w-[18px] text-primary' />
            )}
          </div>
          <div className='min-w-0 flex-1'>
            <div className='truncate font-medium text-[12px] leading-tight'>{name}</div>
            <div className='mt-0.5 text-[10px] text-muted-foreground uppercase'>{sub}</div>
          </div>
        </div>
      )}
      {onRemove && !uploading && (
        <button
          type='button'
          onClick={onRemove}
          className='-right-1.5 -top-1.5 absolute hidden h-4 w-4 items-center justify-center rounded-full bg-foreground text-background shadow group-hover:flex'
          aria-label={`Remove ${name}`}
        >
          <X className='h-2.5 w-2.5' />
        </button>
      )}
    </div>
  )
}
