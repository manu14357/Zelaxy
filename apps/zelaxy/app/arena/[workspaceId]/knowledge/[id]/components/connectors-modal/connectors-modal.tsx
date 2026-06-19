'use client'

import { useCallback, useEffect, useState } from 'react'
import { Github, Globe, Pause, Play, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('ConnectorsModal')

interface ConnectorRow {
  id: string
  type: string
  name: string
  config: Record<string, any>
  frequency: string
  status: string
  enabled: boolean
  lastSyncAt: string | null
  nextSyncAt: string | null
  lastSyncSummary: { added?: number; updated?: number; deleted?: number; error?: string } | null
  failedCount: number
}

interface ConnectorsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  knowledgeBaseId: string
  onSynced?: () => void
}

const FREQUENCIES = [
  { value: 'hourly', label: 'Every hour' },
  { value: '6h', label: 'Every 6 hours' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'manual', label: 'Manual only' },
]

function TypeIcon({ type }: { type: string }) {
  if (type === 'github') return <Github className='h-4 w-4' />
  return <Globe className='h-4 w-4' />
}

export function ConnectorsModal({
  open,
  onOpenChange,
  knowledgeBaseId,
  onSynced,
}: ConnectorsModalProps) {
  const [connectors, setConnectors] = useState<ConnectorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  // form
  const [type, setType] = useState<'github' | 'web'>('github')
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState('daily')
  const [credential, setCredential] = useState('')
  const [ghOwner, setGhOwner] = useState('')
  const [ghRepo, setGhRepo] = useState('')
  const [ghBranch, setGhBranch] = useState('')
  const [ghExtensions, setGhExtensions] = useState('')
  const [webUrls, setWebUrls] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchConnectors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/knowledge/${knowledgeBaseId}/connectors`)
      if (!res.ok) throw new Error(`Failed to load (${res.status})`)
      const json = await res.json()
      setConnectors(json.data ?? [])
    } catch (err) {
      logger.error('load connectors failed', { err })
      setError(err instanceof Error ? err.message : 'Failed to load connectors')
    } finally {
      setLoading(false)
    }
  }, [knowledgeBaseId])

  useEffect(() => {
    if (open) fetchConnectors()
  }, [open, fetchConnectors])

  const resetForm = () => {
    setName('')
    setCredential('')
    setGhOwner('')
    setGhRepo('')
    setGhBranch('')
    setGhExtensions('')
    setWebUrls('')
    setShowForm(false)
  }

  const createConnector = useCallback(async () => {
    if (!name.trim()) return
    const config: Record<string, any> =
      type === 'github'
        ? {
            owner: ghOwner.trim(),
            repo: ghRepo.trim(),
            ...(ghBranch.trim() ? { branch: ghBranch.trim() } : {}),
            ...(ghExtensions.trim()
              ? {
                  extensions: ghExtensions
                    .split(',')
                    .map((e) => e.trim())
                    .filter(Boolean),
                }
              : {}),
          }
        : {
            urls: webUrls
              .split(/[\n,]/)
              .map((u) => u.trim())
              .filter(Boolean),
          }

    setCreating(true)
    setError(null)
    try {
      const res = await fetch(`/api/knowledge/${knowledgeBaseId}/connectors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          name: name.trim(),
          config,
          credential: credential.trim() || null,
          frequency,
        }),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        throw new Error(b.error || `Failed to create (${res.status})`)
      }
      const created = await res.json().catch(() => ({}))
      const newId = created?.data?.id
      resetForm()
      // Trigger the first sync immediately (Connect & Sync).
      if (newId) {
        await fetch(`/api/knowledge/${knowledgeBaseId}/connectors/${newId}/sync`, {
          method: 'POST',
        }).catch(() => {})
      }
      await fetchConnectors()
      onSynced?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create connector')
    } finally {
      setCreating(false)
    }
  }, [
    type,
    name,
    frequency,
    credential,
    ghOwner,
    ghRepo,
    ghBranch,
    ghExtensions,
    webUrls,
    knowledgeBaseId,
    fetchConnectors,
  ])

  const syncConnector = useCallback(
    async (id: string) => {
      setBusyId(id)
      setError(null)
      try {
        const res = await fetch(`/api/knowledge/${knowledgeBaseId}/connectors/${id}/sync`, {
          method: 'POST',
        })
        const b = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(b.error || 'Sync failed')
        await fetchConnectors()
        onSynced?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sync failed')
      } finally {
        setBusyId(null)
      }
    },
    [knowledgeBaseId, fetchConnectors, onSynced]
  )

  const toggleConnector = useCallback(
    async (c: ConnectorRow) => {
      setBusyId(c.id)
      const nextStatus = c.status === 'paused' || !c.enabled ? 'active' : 'paused'
      try {
        await fetch(`/api/knowledge/${knowledgeBaseId}/connectors/${c.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus, enabled: nextStatus === 'active' }),
        })
        await fetchConnectors()
      } finally {
        setBusyId(null)
      }
    },
    [knowledgeBaseId, fetchConnectors]
  )

  const deleteConnector = useCallback(
    async (id: string) => {
      setBusyId(id)
      try {
        await fetch(`/api/knowledge/${knowledgeBaseId}/connectors/${id}?deleteDocuments=true`, {
          method: 'DELETE',
        })
        await fetchConnectors()
        onSynced?.()
      } finally {
        setBusyId(null)
      }
    },
    [knowledgeBaseId, fetchConnectors, onSynced]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[640px]'>
        <DialogHeader>
          <DialogTitle>Connected Sources</DialogTitle>
          <DialogDescription>
            Sync documents from GitHub or the web. New and changed content is re-indexed; removed
            content is dropped.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className='rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[13px] text-destructive'>
            {error}
          </div>
        )}

        {/* Connector list */}
        <div className='space-y-2'>
          {loading ? (
            <p className='py-6 text-center text-muted-foreground text-sm'>Loading…</p>
          ) : connectors.length === 0 ? (
            <p className='py-6 text-center text-muted-foreground text-sm'>No connectors yet.</p>
          ) : (
            connectors.map((c) => (
              <div
                key={c.id}
                className='flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5'
              >
                <TypeIcon type={c.type} />
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='truncate font-medium text-sm'>{c.name}</span>
                    <span className='rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase'>
                      {c.status}
                    </span>
                  </div>
                  <div className='truncate text-[12px] text-muted-foreground'>
                    {c.lastSyncAt
                      ? `Last sync ${new Date(c.lastSyncAt).toLocaleString()}`
                      : 'Never synced'}
                    {c.lastSyncSummary &&
                      !c.lastSyncSummary.error &&
                      ` · +${c.lastSyncSummary.added ?? 0} ~${c.lastSyncSummary.updated ?? 0} -${c.lastSyncSummary.deleted ?? 0}`}
                    {c.lastSyncSummary?.error && ` · ${c.lastSyncSummary.error}`}
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8'
                  title='Sync now'
                  onClick={() => syncConnector(c.id)}
                  disabled={busyId === c.id || c.status === 'syncing'}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${busyId === c.id ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8'
                  title={c.status === 'paused' ? 'Resume' : 'Pause'}
                  onClick={() => toggleConnector(c)}
                  disabled={busyId === c.id}
                >
                  {c.status === 'paused' || !c.enabled ? (
                    <Play className='h-3.5 w-3.5' />
                  ) : (
                    <Pause className='h-3.5 w-3.5' />
                  )}
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-muted-foreground hover:text-destructive'
                  title='Delete connector and its documents'
                  onClick={() => deleteConnector(c.id)}
                  disabled={busyId === c.id}
                >
                  <Trash2 className='h-3.5 w-3.5' />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Add connector */}
        {showForm ? (
          <div className='space-y-3 rounded-lg border border-border/60 bg-card/50 p-4'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label className='text-xs'>Source</Label>
                <Select value={type} onValueChange={(v) => setType(v as 'github' | 'web')}>
                  <SelectTrigger className='h-9'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='github'>GitHub</SelectItem>
                    <SelectItem value='web'>Web pages</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label className='text-xs'>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='h-9'
                  placeholder='Docs repo'
                />
              </div>
            </div>

            {type === 'github' ? (
              <>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-1'>
                    <Label className='text-xs'>Owner</Label>
                    <Input
                      value={ghOwner}
                      onChange={(e) => setGhOwner(e.target.value)}
                      className='h-9'
                      placeholder='vercel'
                    />
                  </div>
                  <div className='space-y-1'>
                    <Label className='text-xs'>Repo</Label>
                    <Input
                      value={ghRepo}
                      onChange={(e) => setGhRepo(e.target.value)}
                      className='h-9'
                      placeholder='next.js'
                    />
                  </div>
                  <div className='space-y-1'>
                    <Label className='text-xs'>Branch (optional)</Label>
                    <Input
                      value={ghBranch}
                      onChange={(e) => setGhBranch(e.target.value)}
                      className='h-9'
                      placeholder='main'
                    />
                  </div>
                  <div className='space-y-1'>
                    <Label className='text-xs'>Extensions (optional)</Label>
                    <Input
                      value={ghExtensions}
                      onChange={(e) => setGhExtensions(e.target.value)}
                      className='h-9'
                      placeholder='md, mdx, txt'
                    />
                  </div>
                </div>
                <div className='space-y-1'>
                  <Label className='text-xs'>Access token (optional, recommended)</Label>
                  <Input
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    className='h-9'
                    type='password'
                    placeholder='ghp_…'
                  />
                </div>
              </>
            ) : (
              <div className='space-y-1'>
                <Label className='text-xs'>URLs (one per line)</Label>
                <textarea
                  value={webUrls}
                  onChange={(e) => setWebUrls(e.target.value)}
                  className='min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                  placeholder={'https://example.com/docs\nhttps://example.com/faq'}
                />
              </div>
            )}

            <div className='space-y-1'>
              <Label className='text-xs'>Sync frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className='h-9'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex gap-2'>
              <Button size='sm' onClick={createConnector} disabled={creating || !name.trim()}>
                {creating ? 'Connecting…' : 'Connect & Sync'}
              </Button>
              <Button size='sm' variant='ghost' onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button size='sm' variant='outline' onClick={() => setShowForm(true)}>
            <Plus className='mr-2 h-4 w-4' />
            New connector
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
