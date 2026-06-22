'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUp, Database, FileText, Loader2, Paperclip, Table, Workflow, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export interface ArenaContext {
  type: 'workflow' | 'knowledge' | 'file' | 'table'
  id: string
  label: string
}

export interface ArenaAttachment {
  id: string
  name: string
  type: string
  key?: string
  path?: string
  previewUrl?: string
  uploading: boolean
  extractedText?: string
  /** Base64 image bytes (no data: prefix) for images — sent to the model as vision content. */
  base64?: string
}

/** Image attachment payload sent to the agent route for multimodal vision. */
export interface ArenaImageAttachment {
  type: 'image'
  data: string
  mediaType: string
}

/** Read a File's bytes as base64 (without the data: URL prefix). */
function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const TYPE_ICON: Record<ArenaContext['type'], typeof Workflow> = {
  workflow: Workflow,
  knowledge: Database,
  file: FileText,
  table: Table,
}

/**
 * ZelaxyArena composer: textarea + an @-mention menu over workspace resources (the mention-data
 * provider is /api/zelaxy-arena/contexts) + file attachments (upload + text extraction). It builds
 * a clean `displayText` for the chat bubble and an enriched `apiText` (context preamble + parsed
 * file contents) sent to the model.
 */
export function ArenaComposer({
  workspaceId,
  isStreaming,
  onSend,
  onStop,
}: {
  workspaceId: string
  isStreaming: boolean
  onSend: (
    displayText: string,
    apiText: string,
    attachments?: ArenaImageAttachment[],
    contexts?: ArenaContext[]
  ) => void
  onStop: () => void
}) {
  const [text, setText] = useState('')
  const [contexts, setContexts] = useState<ArenaContext[]>([])
  const [attachments, setAttachments] = useState<ArenaAttachment[]>([])
  const [resources, setResources] = useState<ArenaContext[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuQuery, setMenuQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const atIndexRef = useRef(-1)

  // Auto-grow the textarea like ChatGPT: expand with content up to ~8 rows, then scroll. This also
  // removes the native scrollbar's up/down arrow buttons that showed when text overflowed a fixed box.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [text])

  const loadResources = useCallback(async () => {
    if (resources.length > 0) return
    try {
      const res = await fetch(`/api/zelaxy-arena/contexts?workspaceId=${workspaceId}`)
      if (res.ok) setResources((await res.json()).contexts ?? [])
    } catch {
      /* ignore */
    }
  }, [workspaceId, resources.length])

  const filtered = menuOpen
    ? resources.filter((r) => r.label.toLowerCase().includes(menuQuery.toLowerCase())).slice(0, 8)
    : []

  const handleChange = (val: string) => {
    setText(val)
    const caret = textareaRef.current?.selectionStart ?? val.length
    const upToCaret = val.slice(0, caret)
    const at = upToCaret.lastIndexOf('@')
    if (at >= 0 && (at === 0 || /\s/.test(upToCaret[at - 1]))) {
      const q = upToCaret.slice(at + 1)
      if (!/\s/.test(q)) {
        atIndexRef.current = at
        setMenuQuery(q)
        setMenuOpen(true)
        setActiveIdx(0)
        void loadResources()
        return
      }
    }
    setMenuOpen(false)
  }

  const selectMention = (item: ArenaContext) => {
    const at = atIndexRef.current
    if (at < 0) return
    const caret = textareaRef.current?.selectionStart ?? text.length
    const before = text.slice(0, at)
    const after = text.slice(caret)
    const inserted = `@${item.label} `
    setText(before + inserted + after)
    setContexts((prev) =>
      prev.some((c) => c.id === item.id && c.type === item.type) ? prev : [...prev, item]
    )
    setMenuOpen(false)
    atIndexRef.current = -1
    requestAnimationFrame(() => {
      const pos = (before + inserted).length
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(pos, pos)
    })
  }

  const uploadFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        const id = crypto.randomUUID()
        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        setAttachments((prev) => [
          ...prev,
          { id, name: file.name, type: file.type, previewUrl, uploading: true },
        ])
        try {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('workspaceId', workspaceId)
          const res = await fetch('/api/files/upload', { method: 'POST', body: fd })
          if (!res.ok) throw new Error('upload failed')
          const data = await res.json()
          const info = data.files ? data.files[0] : data

          // For images, read the bytes as base64 so they can be sent to the model as vision.
          let base64: string | undefined
          if (file.type.startsWith('image/')) {
            base64 = await readAsBase64(file).catch(() => undefined)
          }

          let extractedText: string | undefined
          if (info?.path && !file.type.startsWith('image/')) {
            try {
              const parsed = await fetch('/api/files/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: info.path, fileType: file.type }),
              })
              if (parsed.ok) {
                const pj = await parsed.json()
                extractedText = pj?.output?.content ?? pj?.content ?? pj?.output?.text
              }
            } catch {
              /* parsing is best-effort */
            }
          }
          setAttachments((prev) =>
            prev.map((a) =>
              a.id === id
                ? {
                    ...a,
                    uploading: false,
                    key: info?.key,
                    path: info?.path,
                    extractedText,
                    base64,
                  }
                : a
            )
          )
        } catch {
          setAttachments((prev) => prev.filter((a) => a.id !== id))
        }
      }
    },
    [workspaceId]
  )

  const submit = () => {
    const trimmed = text.trim()
    // Note: we do NOT block on isStreaming — the parent queues messages sent mid-stream.
    if (!trimmed && attachments.length === 0) return
    if (attachments.some((a) => a.uploading)) return

    let apiText = trimmed
    if (contexts.length > 0) {
      const lines = contexts.map((c) => `- ${c.type}: "${c.label}" (id: ${c.id})`).join('\n')
      apiText = `[The user is referring to these workspace resources:\n${lines}\n]\n\n${apiText}`
    }
    const fileSections = attachments
      .map((a) =>
        a.extractedText
          ? `\n\n--- Attached file: ${a.name} ---\n${a.extractedText.slice(0, 12000)}`
          : `\n\n[Attached file: ${a.name}${a.type.startsWith('image/') ? ' (image)' : ''}]`
      )
      .join('')
    apiText += fileSections

    const displayText =
      trimmed +
      (attachments.length ? `\n\n${attachments.map((a) => `📎 ${a.name}`).join('  ')}` : '')
    const imageAttachments: ArenaImageAttachment[] = attachments
      .filter((a) => a.base64)
      .map((a) => ({ type: 'image', data: a.base64!, mediaType: a.type }))
    onSend(
      displayText || '(see attachments)',
      apiText,
      imageAttachments.length ? imageAttachments : undefined,
      contexts.length ? contexts : undefined
    )
    setText('')
    setContexts([])
    setAttachments([])
  }

  return (
    <div className='flex-shrink-0 border-border/40 border-t bg-background px-4 py-3'>
      {/* Selected context chips */}
      {contexts.length > 0 && (
        <div className='mx-auto mb-2 flex w-full max-w-3xl flex-wrap gap-1.5'>
          {contexts.map((c) => {
            const Icon = TYPE_ICON[c.type]
            return (
              <span
                key={`${c.type}:${c.id}`}
                className='flex items-center gap-1 rounded-md border border-border/60 bg-card/50 px-1.5 py-0.5 text-[11px]'
              >
                <Icon className='h-3 w-3 text-muted-foreground' />
                {c.label}
                <button
                  type='button'
                  onClick={() => setContexts((prev) => prev.filter((x) => x !== c))}
                  className='text-muted-foreground hover:text-foreground'
                >
                  <X className='h-3 w-3' />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div className='mx-auto mb-2 flex w-full max-w-3xl flex-wrap gap-1.5'>
          {attachments.map((a) => (
            <span
              key={a.id}
              className='flex items-center gap-1 rounded-md border border-border/60 bg-card/50 px-1.5 py-0.5 text-[11px]'
            >
              {a.uploading ? (
                <Loader2 className='h-3 w-3 animate-spin text-primary' />
              ) : a.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.previewUrl} alt={a.name} className='h-4 w-4 rounded object-cover' />
              ) : (
                <FileText className='h-3 w-3 text-muted-foreground' />
              )}
              {a.name}
              <button
                type='button'
                onClick={() => setAttachments((prev) => prev.filter((x) => x !== a))}
                className='text-muted-foreground hover:text-foreground'
              >
                <X className='h-3 w-3' />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className='relative mx-auto w-full max-w-3xl'>
        {/* Mention menu */}
        {menuOpen && filtered.length > 0 && (
          <div className='absolute bottom-full left-0 z-30 mb-1 max-h-60 w-72 overflow-auto rounded-lg border border-border/60 bg-popover p-1 shadow-lg'>
            {filtered.map((item, idx) => {
              const Icon = TYPE_ICON[item.type]
              return (
                <button
                  key={`${item.type}:${item.id}`}
                  type='button'
                  onMouseDown={(e) => {
                    e.preventDefault()
                    selectMention(item)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px]',
                    idx === activeIdx ? 'bg-muted' : 'hover:bg-muted/60'
                  )}
                >
                  <Icon className='h-3.5 w-3.5 flex-shrink-0 text-muted-foreground' />
                  <span className='truncate'>{item.label}</span>
                  <span className='ml-auto text-[10px] text-muted-foreground capitalize'>
                    {item.type}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            const files = Array.from(e.dataTransfer.files)
            if (files.length) void uploadFiles(files)
          }}
          className={cn(
            'flex items-end gap-2 rounded-2xl border border-border/60 bg-card/40 px-3 py-2 focus-within:border-primary/40',
            isDragging && 'border-primary border-dashed bg-primary/5'
          )}
        >
          <input
            type='file'
            multiple
            id='arena-file-input'
            className='hidden'
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              if (files.length) void uploadFiles(files)
              e.target.value = ''
            }}
          />
          <Button
            size='icon'
            variant='ghost'
            className='h-8 w-8 flex-shrink-0'
            onClick={() => document.getElementById('arena-file-input')?.click()}
            title='Attach files'
          >
            <Paperclip className='h-4 w-4' />
          </Button>
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onPaste={(e) => {
              const files = Array.from(e.clipboardData.files)
              if (files.length) {
                e.preventDefault()
                void uploadFiles(files)
              }
            }}
            onKeyDown={(e) => {
              if (menuOpen && filtered.length > 0) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActiveIdx((i) => (i + 1) % filtered.length)
                  return
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActiveIdx((i) => (i - 1 + filtered.length) % filtered.length)
                  return
                }
                if (e.key === 'Enter' || e.key === 'Tab') {
                  e.preventDefault()
                  selectMention(filtered[activeIdx])
                  return
                }
                if (e.key === 'Escape') {
                  setMenuOpen(false)
                  return
                }
              }
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder='Describe what you want — use @ to reference resources, or attach files…'
            rows={1}
            className='composer-bare-textarea max-h-[200px] min-h-[24px] flex-1 resize-none overflow-y-auto border-0 bg-transparent p-0 text-sm leading-6 shadow-none focus-visible:ring-0'
          />
          {isStreaming ? (
            <Button size='icon' variant='ghost' className='h-8 w-8 flex-shrink-0' onClick={onStop}>
              <span className='h-3 w-3 rounded-[2px] bg-foreground' />
            </Button>
          ) : (
            <Button
              size='icon'
              className='h-8 w-8 flex-shrink-0 rounded-full'
              disabled={
                (!text.trim() && attachments.length === 0) || attachments.some((a) => a.uploading)
              }
              onClick={submit}
            >
              <ArrowUp className='h-4 w-4' />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
