'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, KeySquare, Plus, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/lib/auth-client'
import { createLogger } from '@/lib/logs/console/logger'
import { SettingPageHeader } from '../shared'

const logger = createLogger('ApiKeys')

// ── Types ────────────────────────────────────────────────────────────────────

interface ApiKeysProps {
  onOpenChange?: (open: boolean) => void
}

interface ApiKey {
  id: string
  name: string
  key: string
  lastUsed?: string
  createdAt: string
  expiresAt?: string
}

// ── Component ────────────────────────────────────────────────────────────────

export function ApiKeys({ onOpenChange }: ApiKeysProps) {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKey, setNewKey] = useState<ApiKey | null>(null)
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)
  const [deleteKey, setDeleteKey] = useState<ApiKey | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  // ── Data Fetching ────────────────────────────────────────────────────────

  const fetchApiKeys = async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const response = await fetch('/api/users/me/api-keys')
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.keys || [])
      }
    } catch (error) {
      logger.error('Error fetching API keys:', { error })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateKey = async () => {
    if (!userId || !newKeyName.trim()) return
    setIsCreating(true)
    try {
      const response = await fetch('/api/users/me/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      if (response.ok) {
        const data = await response.json()
        setNewKey(data.key)
        setShowNewKeyDialog(true)
        setNewKeyName('')
        fetchApiKeys()
      }
    } catch (error) {
      logger.error('Error creating API key:', { error })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteKey = async () => {
    if (!userId || !deleteKey) return
    try {
      const response = await fetch(`/api/users/me/api-keys/${deleteKey.id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchApiKeys()
        setShowDeleteDialog(false)
        setDeleteKey(null)
      }
    } catch (error) {
      logger.error('Error deleting API key:', { error })
    }
  }

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  useEffect(() => {
    if (userId) fetchApiKeys()
  }, [userId])

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className='space-y-6 px-3 py-6'>
      <SettingPageHeader
        title='API Keys'
        description='Manage API keys for programmatic access to your account.'
        action={
          <Button
            onClick={() => setIsCreating(true)}
            disabled={isLoading}
            size='sm'
            className='h-8 gap-1.5 rounded-lg text-[13px]'
          >
            <Plus className='h-3.5 w-3.5' />
            Create Key
          </Button>
        }
      />

      {/* Info Banner */}
      <div className='flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 dark:border-primary/25 dark:bg-primary/15'>
        <span className='mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 dark:bg-primary/20'>
          <KeySquare className='h-3.5 w-3.5 text-primary dark:text-primary/80' />
        </span>
        <div>
          <p className='font-medium text-[13px] text-primary dark:text-primary/80'>
            Secure API Access
          </p>
          <p className='mt-0.5 text-[12px] text-primary leading-relaxed dark:text-primary/60'>
            API keys are shown only once upon creation. Store them securely and never share them
            publicly.
          </p>
        </div>
      </div>

      {/* Key List */}
      {isLoading ? (
        <div className='space-y-3'>
          <KeySkeleton />
          <KeySkeleton />
        </div>
      ) : apiKeys.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-xl border border-border/60 border-dashed py-12 text-center'>
          <span className='flex h-11 w-11 items-center justify-center rounded-full bg-muted/70'>
            <KeySquare className='h-5 w-5 text-muted-foreground' />
          </span>
          <h3 className='mt-4 font-medium text-[14px] text-foreground'>No API keys yet</h3>
          <p className='mt-1.5 max-w-xs text-[12px] text-muted-foreground'>
            Create an API key to get started with the Zelaxy SDK.
          </p>
          <Button
            size='sm'
            className='mt-4 h-8 gap-1.5 rounded-lg text-[13px]'
            onClick={() => setIsCreating(true)}
          >
            <Plus className='h-3.5 w-3.5' /> Create Key
          </Button>
        </div>
      ) : (
        <div className='space-y-2'>
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className='group flex items-center justify-between rounded-xl border border-border/60 bg-card/50 px-4 py-3.5 transition-colors hover:bg-muted/30'
            >
              <div className='min-w-0'>
                <p className='font-medium text-[13px] text-foreground'>{key.name}</p>
                <div className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5'>
                  <span className='text-[11px] text-muted-foreground'>
                    Created {formatDate(key.createdAt)}
                  </span>
                  <span className='text-[11px] text-muted-foreground'>
                    Last used {formatDate(key.lastUsed)}
                  </span>
                  <code className='rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground'>
                    •••••{key.key.slice(-6)}
                  </code>
                </div>
              </div>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => {
                  setDeleteKey(key)
                  setShowDeleteDialog(true)
                }}
                className='h-7 w-7 shrink-0 rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100'
              >
                <Trash2 className='h-3.5 w-3.5' />
                <span className='sr-only'>Delete key</span>
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Dialog ──────────────────────────────────────────── */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className='rounded-xl sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-[15px]'>Create new API key</DialogTitle>
            <DialogDescription className='text-[13px]'>
              Name your API key to help you identify it later.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3 py-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='keyName' className='text-[13px]'>
                Name
              </Label>
              <Input
                id='keyName'
                placeholder='e.g., Development, Production'
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className='h-9 rounded-lg text-[13px]'
              />
            </div>
          </div>
          <DialogFooter className='gap-2 sm:justify-end'>
            <Button
              variant='outline'
              size='sm'
              className='h-8 rounded-lg text-[13px]'
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </Button>
            <Button
              size='sm'
              className='h-8 rounded-lg text-[13px]'
              onClick={handleCreateKey}
              disabled={!newKeyName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── New Key Reveal Dialog ──────────────────────────────────── */}
      <Dialog
        open={showNewKeyDialog}
        onOpenChange={(open) => {
          setShowNewKeyDialog(open)
          if (!open) setNewKey(null)
        }}
      >
        <DialogContent className='rounded-xl sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-[15px]'>API key created</DialogTitle>
            <DialogDescription className='text-[13px]'>
              Copy your key now — you won't be able to see it again.
            </DialogDescription>
          </DialogHeader>
          {newKey && (
            <div className='space-y-3 py-2'>
              <div className='space-y-1.5'>
                <Label className='text-[13px]'>API Key</Label>
                <div className='relative'>
                  <Input
                    readOnly
                    value={newKey.key}
                    className='h-9 rounded-lg bg-muted/40 pr-10 font-mono text-[12px]'
                  />
                  <Button
                    variant='ghost'
                    size='sm'
                    className='-translate-y-1/2 absolute top-1/2 right-1 h-7 w-7 rounded-md'
                    onClick={() => copyToClipboard(newKey.key)}
                  >
                    {copySuccess ? (
                      <Check className='h-3.5 w-3.5 text-emerald-500' />
                    ) : (
                      <Copy className='h-3.5 w-3.5' />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className='sm:justify-end'>
            <Button
              size='sm'
              className='h-8 rounded-lg text-[13px]'
              onClick={() => {
                setShowNewKeyDialog(false)
                setNewKey(null)
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ────────────────────────────────────── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className='rounded-xl sm:max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-[15px]'>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription className='text-[13px]'>
              {deleteKey && (
                <>
                  Are you sure you want to delete{' '}
                  <span className='font-semibold'>{deleteKey.name}</span>? Any integrations using
                  this key will stop working.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='gap-2 sm:justify-end'>
            <AlertDialogCancel
              className='h-8 rounded-lg text-[13px]'
              onClick={() => setDeleteKey(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteKey}
              className='h-8 rounded-lg bg-destructive text-[13px] text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function KeySkeleton() {
  return (
    <div className='flex items-center justify-between rounded-xl border border-border/40 px-4 py-3.5'>
      <div>
        <Skeleton className='mb-2 h-4 w-28 rounded-md' />
        <Skeleton className='h-3 w-44 rounded-md' />
      </div>
      <Skeleton className='h-7 w-7 rounded-md' />
    </div>
  )
}
