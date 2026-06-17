'use client'

import { useCallback, useEffect, useState } from 'react'
import { Building2, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createLogger } from '@/lib/logs/console/logger'
import { useOrganizationStore } from '@/stores/organization'
import { SettingPageHeader } from '../shared'

const logger = createLogger('OrgEnvironment')

interface EnvVarRow {
  key: string
  value: string
}

interface OrgEnvironmentProps {
  onOpenChange?: (open: boolean) => void
}

export function OrgEnvironment(_props: OrgEnvironmentProps) {
  const { activeOrganization } = useOrganizationStore()
  const orgId = activeOrganization?.id

  const [rows, setRows] = useState<EnvVarRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const fetchVars = useCallback(async () => {
    if (!orgId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/organizations/${orgId}/environment`)
      if (!res.ok) throw new Error(`Failed to load environment (${res.status})`)
      const json = await res.json()
      const data = (json.data ?? {}) as Record<string, { key: string; value: string }>
      const loaded = Object.values(data).map((v) => ({ key: v.key, value: v.value }))
      setRows(loaded.length > 0 ? loaded : [{ key: '', value: '' }])
    } catch (err) {
      logger.error('Error loading org environment:', err)
      setError(err instanceof Error ? err.message : 'Failed to load environment')
    } finally {
      setIsLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    fetchVars()
  }, [fetchVars])

  const updateRow = (index: number, field: keyof EnvVarRow, value: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const addRow = () => setRows((prev) => [...prev, { key: '', value: '' }])
  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index))

  const save = useCallback(async () => {
    if (!orgId) return
    setIsSaving(true)
    setError(null)
    try {
      const variables: Record<string, string> = {}
      for (const row of rows) {
        const key = row.key.trim()
        if (key) variables[key] = row.value
      }
      const res = await fetch(`/api/organizations/${orgId}/environment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Failed to save (${res.status})`)
      }
      setSavedAt(new Date().toLocaleTimeString())
    } catch (err) {
      logger.error('Error saving org environment:', err)
      setError(err instanceof Error ? err.message : 'Failed to save environment')
    } finally {
      setIsSaving(false)
    }
  }, [orgId, rows])

  if (!orgId) {
    return (
      <div className='space-y-6 px-3 py-6'>
        <SettingPageHeader
          title='Organization Environment'
          description='Shared environment variables available to every workspace in your organization.'
        />
        <div className='flex flex-col items-center justify-center gap-2 rounded-xl border border-border/60 border-dashed py-12 text-center'>
          <Building2 className='h-7 w-7 text-muted-foreground/60' />
          <p className='text-muted-foreground text-sm'>
            You need an organization to manage organization-level environment variables.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6 px-3 py-6'>
      <SettingPageHeader
        title='Organization Environment'
        description='Shared, encrypted environment variables available to every workspace in your organization.'
        action={
          <Button size='sm' onClick={save} disabled={isSaving || isLoading}>
            <Save className='mr-1.5 h-3.5 w-3.5' />
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        }
      />

      {error && (
        <div className='rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[13px] text-destructive'>
          {error}
        </div>
      )}
      {savedAt && !error && (
        <div className='rounded-lg border border-emerald-200/60 bg-emerald-50/50 px-3 py-2 text-[13px] text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300'>
          Saved at {savedAt}
        </div>
      )}

      <div className='rounded-xl border border-border/60 bg-card/50 p-3 sm:p-5'>
        {isLoading ? (
          <p className='py-6 text-center text-muted-foreground text-sm'>Loading…</p>
        ) : (
          <div className='space-y-2'>
            <div className='grid grid-cols-[minmax(0,1fr),minmax(0,1fr),40px] gap-2 sm:gap-4'>
              <span className='font-medium text-[11px] text-muted-foreground uppercase tracking-wide'>
                Key
              </span>
              <span className='font-medium text-[11px] text-muted-foreground uppercase tracking-wide'>
                Value
              </span>
              <span />
            </div>
            {rows.map((row, index) => (
              <div
                key={index}
                className='grid grid-cols-[minmax(0,1fr),minmax(0,1fr),40px] gap-2 sm:gap-4'
              >
                <Input
                  value={row.key}
                  onChange={(e) => updateRow(index, 'key', e.target.value)}
                  placeholder='API_KEY'
                  className='h-9 font-mono text-[13px]'
                />
                <Input
                  type='password'
                  value={row.value}
                  onChange={(e) => updateRow(index, 'value', e.target.value)}
                  placeholder='value'
                  className='h-9 font-mono text-[13px]'
                />
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-9 w-9 text-muted-foreground hover:text-destructive'
                  onClick={() => removeRow(index)}
                >
                  <Trash2 className='h-3.5 w-3.5' />
                </Button>
              </div>
            ))}
            <Button variant='outline' size='sm' className='mt-2' onClick={addRow}>
              <Plus className='mr-1.5 h-3.5 w-3.5' />
              Add variable
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
