'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Pencil, Plus, Search, Sparkles, Trash2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('SkillsPanel')

interface Skill {
  id: string
  name: string
  description: string
  content: string
  updatedAt: string
}

type Mode = 'list' | 'create' | 'import'

export function Skills() {
  const params = useParams()
  const workspaceId = params.workspaceId as string

  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<Mode>('list')
  const [busy, setBusy] = useState(false)

  // create/edit form
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  // import form
  const [importUrl, setImportUrl] = useState('')
  const [importText, setImportText] = useState('')

  const fetchSkills = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/skills?workspaceId=${workspaceId}`)
      if (!res.ok) throw new Error(`Failed to load skills (${res.status})`)
      const json = await res.json()
      setSkills(json.skills ?? [])
    } catch (err) {
      logger.error('load skills failed', { err })
      setError(err instanceof Error ? err.message : 'Failed to load skills')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setDescription('')
    setContent('')
    setImportUrl('')
    setImportText('')
    setMode('list')
  }

  const startEdit = (s: Skill) => {
    setEditingId(s.id)
    setName(s.name)
    setDescription(s.description)
    setContent(s.content)
    setMode('create')
  }

  const saveSkill = useCallback(async () => {
    if (!name.trim() || !description.trim() || !content.trim()) {
      setError('Name, description, and content are required')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(editingId ? `/api/skills/${editingId}` : '/api/skills', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          name: name.trim(),
          description: description.trim(),
          content,
        }),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        throw new Error(b.error || 'Save failed')
      }
      resetForm()
      await fetchSkills()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }, [editingId, name, description, content, workspaceId, fetchSkills])

  const importSkill = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const isUrl = importUrl.trim().length > 0
      const res = await fetch('/api/skills/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          source: isUrl ? 'github' : 'paste',
          ...(isUrl ? { url: importUrl.trim() } : { content: importText }),
        }),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        throw new Error(b.error || 'Import failed')
      }
      resetForm()
      await fetchSkills()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setBusy(false)
    }
  }, [importUrl, importText, workspaceId, fetchSkills])

  const deleteSkill = useCallback(
    async (id: string) => {
      setBusy(true)
      try {
        await fetch(`/api/skills/${id}?workspaceId=${workspaceId}`, { method: 'DELETE' })
        setSkills((prev) => prev.filter((s) => s.id !== id))
      } finally {
        setBusy(false)
      }
    },
    [workspaceId]
  )

  const filtered = useMemo(
    () =>
      query.trim()
        ? skills.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()))
        : skills,
    [skills, query]
  )

  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center justify-between gap-3 px-6 pt-[14px] pb-4'>
        <div>
          <h1 className='font-semibold text-lg'>Skills</h1>
          <p className='text-muted-foreground text-sm'>
            Reusable instruction packages your agents load on demand.
          </p>
        </div>
        {mode === 'list' && (
          <div className='flex items-center gap-2'>
            <div className='relative w-56'>
              <Search className='-translate-y-1/2 absolute top-1/2 left-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Search skills…'
                className='h-9 pl-8'
              />
            </div>
            <Button size='sm' variant='outline' onClick={() => setMode('import')}>
              <Download className='mr-2 h-4 w-4' />
              Import
            </Button>
            <Button size='sm' onClick={() => setMode('create')}>
              <Plus className='mr-2 h-4 w-4' />
              New skill
            </Button>
          </div>
        )}
      </div>

      <div className='flex-1 overflow-auto px-6 pb-6'>
        {error && (
          <div className='mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[13px] text-destructive'>
            {error}
          </div>
        )}

        {mode === 'create' && (
          <div className='space-y-3 rounded-xl border border-border/60 bg-card/50 p-4'>
            <div className='font-medium text-sm'>{editingId ? 'Edit skill' : 'New skill'}</div>
            <div className='space-y-1'>
              <Label className='text-xs'>Name (kebab-case)</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='sql-expert'
                className='h-9'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>Description (what it does + when to use it)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Write optimized SQL for Postgres/MySQL; use when the task involves queries.'
                className='h-9'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>Content (markdown)</Label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className='min-h-[220px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm'
                placeholder={'# SQL Expert\n\n## When to use\n...\n\n## Instructions\n1. ...'}
              />
            </div>
            <div className='flex gap-2'>
              <Button size='sm' onClick={saveSkill} disabled={busy}>
                {busy ? 'Saving…' : editingId ? 'Save changes' : 'Create skill'}
              </Button>
              <Button size='sm' variant='ghost' onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {mode === 'import' && (
          <div className='space-y-3 rounded-xl border border-border/60 bg-card/50 p-4'>
            <div className='font-medium text-sm'>Import a SKILL.md</div>
            <div className='space-y-1'>
              <Label className='text-xs'>GitHub URL to a SKILL.md</Label>
              <Input
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder='https://github.com/owner/repo/blob/main/SKILL.md'
                className='h-9'
              />
            </div>
            <div className='text-center text-muted-foreground text-xs'>— or paste —</div>
            <div className='space-y-1'>
              <Label className='text-xs'>Paste SKILL.md content (with YAML frontmatter)</Label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className='min-h-[180px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm'
                placeholder={'---\nname: my-skill\ndescription: ...\n---\n\n# My Skill\n...'}
              />
            </div>
            <div className='flex gap-2'>
              <Button
                size='sm'
                onClick={importSkill}
                disabled={busy || (!importUrl.trim() && !importText.trim())}
              >
                {busy ? 'Importing…' : 'Import'}
              </Button>
              <Button size='sm' variant='ghost' onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {mode === 'list' &&
          (loading ? (
            <p className='py-10 text-center text-muted-foreground text-sm'>Loading…</p>
          ) : filtered.length === 0 ? (
            <div className='flex flex-col items-center gap-2 py-16 text-center'>
              <Sparkles className='h-8 w-8 text-muted-foreground/50' />
              <p className='text-muted-foreground text-sm'>
                {query
                  ? 'No matching skills.'
                  : 'No skills yet. Create or import one to get started.'}
              </p>
            </div>
          ) : (
            <div className='rounded-xl border border-border/60'>
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className='flex items-start gap-3 border-border/30 border-b px-4 py-3 last:border-b-0'
                >
                  <Sparkles className='mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground' />
                  <div className='min-w-0 flex-1'>
                    <div className='truncate font-medium text-sm'>{s.name}</div>
                    <div className='line-clamp-2 text-[12px] text-muted-foreground'>
                      {s.description}
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8'
                    title='Edit'
                    onClick={() => startEdit(s)}
                    disabled={busy}
                  >
                    <Pencil className='h-3.5 w-3.5' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 text-muted-foreground hover:text-destructive'
                    title='Delete'
                    onClick={() => deleteSkill(s.id)}
                    disabled={busy}
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                  </Button>
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  )
}
