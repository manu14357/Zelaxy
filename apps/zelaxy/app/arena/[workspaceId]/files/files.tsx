'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Code,
  Download,
  FileAudio,
  FileIcon,
  FileText,
  FileVideo,
  type LucideIcon,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('FilesPanel')

interface WorkspaceFile {
  id: string
  name: string
  size: number
  type: string
  category: string
  folder: string | null
  url: string
  createdAt: string
  updatedAt: string
}

const CATEGORY_ICON: Record<string, LucideIcon> = {
  document: FileText,
  image: FileIcon,
  audio: FileAudio,
  video: FileVideo,
  code: Code,
  other: FileIcon,
}

const CATEGORY_ORDER = ['document', 'image', 'audio', 'video', 'code', 'other']

function formatSize(bytes: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}

export function Files() {
  const params = useParams()
  const workspaceId = params.workspaceId as string

  const [files, setFiles] = useState<WorkspaceFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchFiles = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/files`)
      if (!res.ok) throw new Error(`Failed to load files (${res.status})`)
      const json = await res.json()
      setFiles(json.files ?? [])
    } catch (err) {
      logger.error('load files failed', { err })
      setError(err instanceof Error ? err.message : 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const renameFile = useCallback(
    async (file: WorkspaceFile) => {
      const next = window.prompt('Rename file', file.name)
      if (!next || next.trim() === file.name) return
      setBusyId(file.id)
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/files/${file.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: next.trim() }),
        })
        if (!res.ok) throw new Error('Rename failed')
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, name: next.trim() } : f)))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Rename failed')
      } finally {
        setBusyId(null)
      }
    },
    [workspaceId]
  )

  const deleteFile = useCallback(
    async (id: string) => {
      setBusyId(id)
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/files/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Delete failed')
        setFiles((prev) => prev.filter((f) => f.id !== id))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed')
      } finally {
        setBusyId(null)
      }
    },
    [workspaceId]
  )

  const grouped = useMemo(() => {
    const filtered = query.trim()
      ? files.filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase()))
      : files
    const map = new Map<string, WorkspaceFile[]>()
    for (const f of filtered) {
      const cat = CATEGORY_ORDER.includes(f.category) ? f.category : 'other'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(f)
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      files: map.get(c)!,
    }))
  }, [files, query])

  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center justify-between gap-3 px-6 pt-[14px] pb-4'>
        <div>
          <h1 className='font-semibold text-lg'>Files</h1>
          <p className='text-muted-foreground text-sm'>
            Documents, images, and media shared across this workspace.
          </p>
        </div>
        <div className='relative w-64'>
          <Search className='-translate-y-1/2 absolute top-1/2 left-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search files…'
            className='h-9 pl-8'
          />
        </div>
      </div>

      <div className='flex-1 overflow-auto px-6 pb-6'>
        {error && (
          <div className='mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[13px] text-destructive'>
            {error}
          </div>
        )}

        {loading ? (
          <p className='py-10 text-center text-muted-foreground text-sm'>Loading…</p>
        ) : grouped.length === 0 ? (
          <div className='flex flex-col items-center gap-2 py-16 text-center'>
            <FileIcon className='h-8 w-8 text-muted-foreground/50' />
            <p className='text-muted-foreground text-sm'>
              {query
                ? 'No matching files.'
                : 'No files yet. Workflows that write files will appear here.'}
            </p>
          </div>
        ) : (
          <div className='space-y-6'>
            {grouped.map(({ category, files: catFiles }) => {
              const Icon = CATEGORY_ICON[category] ?? FileIcon
              return (
                <div key={category}>
                  <div className='mb-2 flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide'>
                    <Icon className='h-3.5 w-3.5' />
                    {category} · {catFiles.length}
                  </div>
                  <div className='rounded-xl border border-border/60'>
                    {catFiles.map((f) => (
                      <div
                        key={f.id}
                        className='flex items-center gap-3 border-border/30 border-b px-4 py-2.5 last:border-b-0'
                      >
                        <Icon className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
                        <div className='min-w-0 flex-1'>
                          <div className='truncate font-medium text-sm'>{f.name}</div>
                          <div className='text-[12px] text-muted-foreground'>
                            {formatSize(f.size)} · {new Date(f.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <a href={f.url} target='_blank' rel='noopener noreferrer' title='Download'>
                          <Button variant='ghost' size='icon' className='h-8 w-8'>
                            <Download className='h-3.5 w-3.5' />
                          </Button>
                        </a>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8'
                          title='Rename'
                          onClick={() => renameFile(f)}
                          disabled={busyId === f.id}
                        >
                          <Pencil className='h-3.5 w-3.5' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-muted-foreground hover:text-destructive'
                          title='Delete'
                          onClick={() => deleteFile(f.id)}
                          disabled={busyId === f.id}
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
