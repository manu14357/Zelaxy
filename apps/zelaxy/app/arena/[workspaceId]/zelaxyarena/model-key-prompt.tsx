'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface MissingCred {
  name: string
  label: string
  optional?: boolean
  placeholder?: string
}

/**
 * Inline "missing API key" prompt (shared by ZelaxyArena + Agie). Checks /api/providers/key-status
 * for the given model; if the provider key isn't configured in the user's environment, it shows
 * input(s) to enter it and saves them — MERGED with existing vars — into Environment Variables via
 * /api/environment. Renders nothing when the key is already available.
 */
export function ModelKeyPrompt({ model }: { model: string }) {
  const [missing, setMissing] = useState<MissingCred[]>([])
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    setMissing([])
    setInputs({})
    if (!model) return
    fetch(`/api/providers/key-status?model=${encodeURIComponent(model)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setMissing(data.available ? [] : data.missing || [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [model])

  const save = useCallback(async () => {
    const entries = Object.entries(inputs).filter(([, v]) => v.trim())
    const requiredOk = missing
      .filter((c) => !c.optional)
      .every((c) => (inputs[c.name] || '').trim())
    if (!requiredOk || entries.length === 0) return
    setSaving(true)
    try {
      // GET returns { data: { NAME: { value } } } — flatten + MERGE so we don't drop existing vars.
      const existing = await fetch('/api/environment')
        .then((r) => (r.ok ? r.json() : { data: {} }))
        .catch(() => ({ data: {} }))
      const variables: Record<string, string> = {}
      for (const [name, entry] of Object.entries(existing.data || {})) {
        variables[name] = (entry as { value?: string })?.value ?? ''
      }
      for (const [name, value] of entries) variables[name] = value.trim()
      const res = await fetch('/api/environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables }),
      })
      if (res.ok) {
        setMissing([])
        setInputs({})
      }
    } finally {
      setSaving(false)
    }
  }, [inputs, missing])

  if (missing.length === 0) return null

  return (
    <div className='flex flex-col gap-2 border-amber-500/30 border-b bg-amber-500/10 px-3 py-2.5'>
      <p className='text-[12px] text-amber-700 dark:text-amber-300'>
        {missing.length > 1
          ? 'Add these keys to use this model:'
          : 'No API key for this model. Add it to use it:'}
      </p>
      <div className='flex flex-wrap items-end gap-2'>
        {missing.map((c) => (
          <div key={c.name} className='flex flex-col gap-0.5'>
            <label htmlFor={`key-input-${c.name}`} className='text-[10px] text-muted-foreground'>
              {c.label}
              {c.optional ? ' (optional)' : ''}
            </label>
            <Input
              id={`key-input-${c.name}`}
              type='password'
              value={inputs[c.name] || ''}
              onChange={(e) => setInputs((p) => ({ ...p, [c.name]: e.target.value }))}
              placeholder={c.placeholder || c.name}
              className='h-7 w-48 text-xs'
            />
          </div>
        ))}
        <Button size='sm' className='h-7' onClick={save} disabled={saving}>
          {saving ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : 'Save key'}
        </Button>
      </div>
    </div>
  )
}
