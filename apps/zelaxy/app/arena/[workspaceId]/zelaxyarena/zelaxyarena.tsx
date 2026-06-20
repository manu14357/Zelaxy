'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUp, Bot, Loader2, Network, Plus, Sparkles, Wrench } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'
import CopilotMarkdownRenderer from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/panel/components/copilot/components/copilot-message/components/markdown-renderer'
import { ModelPicker } from '@/app/arena/[workspaceId]/zelaxyarena/model-picker'
import { DEFAULT_CHAT_MODEL } from '@/providers/models'

const logger = createLogger('ZelaxyArena')

interface MissingCred {
  name: string
  label: string
  optional?: boolean
  placeholder?: string
}

interface ToolAction {
  id: string
  name: string
  status: 'running' | 'done' | 'error'
  summary?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  tools?: ToolAction[]
}

interface ResourceArtifact {
  kind: 'workflow'
  title: string
  yaml: string
  /** Set once the workflow is persisted and openable in the editor. */
  workflowId?: string
}

const SUGGESTIONS = [
  'Build a workflow that scrapes a URL, summarizes it with Claude, and posts to Slack',
  'List the workflows in this workspace and what each one does',
  'What environment variables are configured in this workspace?',
  'Create a lead-enrichment workflow that writes results to a table',
]

function prettyToolName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function ZelaxyArena() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [artifact, setArtifact] = useState<ResourceArtifact | null>(null)
  const [model, setModel] = useState<string>(DEFAULT_CHAT_MODEL)
  // Dynamic API-key check: when the selected model's provider lacks credentials, prompt for the
  // missing fields (some providers need more than one — e.g. AWS Bedrock).
  const [missingCreds, setMissingCreds] = useState<MissingCred[]>([])
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({})
  const [savingKey, setSavingKey] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // When the selected model changes, check (in the background) whether credentials are available.
  useEffect(() => {
    let cancelled = false
    setMissingCreds([])
    setKeyInputs({})
    fetch(`/api/providers/key-status?model=${encodeURIComponent(model)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        setMissingCreds(data.available ? [] : data.missing || [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [model])

  // Save the entered credential fields into the user's Environment Variables (merged).
  const saveKey = useCallback(async () => {
    const entries = Object.entries(keyInputs).filter(([, v]) => v.trim())
    // All required (non-optional) fields must be filled.
    const requiredOk = missingCreds
      .filter((c) => !c.optional)
      .every((c) => (keyInputs[c.name] || '').trim())
    if (!requiredOk || entries.length === 0) return
    setSavingKey(true)
    try {
      const existing = await fetch('/api/environment')
        .then((r) => (r.ok ? r.json() : { variables: {} }))
        .catch(() => ({ variables: {} }))
      const variables = { ...(existing.variables || {}) }
      for (const [name, value] of entries) variables[name] = value.trim()
      const res = await fetch('/api/environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables }),
      })
      if (res.ok) {
        setMissingCreds([])
        setKeyInputs({})
      }
    } finally {
      setSavingKey(false)
    }
  }, [keyInputs, missingCreds])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isStreaming) return

      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: trimmed }
      const assistantId = crypto.randomUUID()
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        tools: [],
      }

      const history = [...messages, userMsg]
      setMessages([...history, assistantMsg])
      setInput('')
      setIsStreaming(true)

      const updateAssistant = (fn: (m: ChatMessage) => ChatMessage) =>
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? fn(m) : m)))

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch(`/api/zelaxy-arena/agent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            workspaceId,
            model,
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          }),
        })

        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({ error: `Request failed (${res.status})` }))
          updateAssistant((m) => ({ ...m, content: `⚠️ ${err.error || 'Request failed'}` }))
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine.startsWith('data: ')) continue
            const payload = trimmedLine.slice(6)
            let event: any
            try {
              event = JSON.parse(payload)
            } catch {
              continue
            }

            if (event.type === 'content') {
              updateAssistant((m) => ({ ...m, content: m.content + (event.data || '') }))
            } else if (event.type === 'tool_call') {
              const t: ToolAction = {
                id: event.data?.id || crypto.randomUUID(),
                name: event.data?.name || 'tool',
                status: 'running',
              }
              updateAssistant((m) => ({ ...m, tools: [...(m.tools || []), t] }))
            } else if (event.type === 'tool_result') {
              const toolName = event.name
              updateAssistant((m) => ({
                ...m,
                tools: (m.tools || []).map((t) =>
                  t.id === event.toolCallId
                    ? {
                        ...t,
                        status: event.success ? 'done' : 'error',
                        summary: event.error || undefined,
                      }
                    : t
                ),
              }))
              // Surface a built workflow into the resource panel.
              if (
                (toolName === 'build_workflow' || toolName === 'edit_workflow') &&
                event.success
              ) {
                try {
                  const data = JSON.parse(event.result || '{}')
                  if (data.yamlContent) {
                    setArtifact({
                      kind: 'workflow',
                      title: data.description || 'Generated workflow',
                      yaml: data.yamlContent,
                    })
                  }
                } catch (e) {
                  logger.warn('Failed to parse build_workflow result', { e })
                }
              }
            } else if (event.type === 'workflow_created') {
              // The agent persisted a real, openable workflow.
              setArtifact((prev) => ({
                kind: 'workflow',
                title: event.name || prev?.title || 'New workflow',
                yaml: prev?.yaml || '',
                workflowId: event.workflowId,
              }))
            } else if (event.type === 'error') {
              updateAssistant((m) => ({ ...m, content: `${m.content}\n\n⚠️ ${event.error}` }))
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          logger.error('ZelaxyArena stream error', { err })
          updateAssistant((m) => ({ ...m, content: m.content || '⚠️ Connection error' }))
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [messages, isStreaming, workspaceId, model]
  )

  const stop = () => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }

  const newChat = () => {
    abortRef.current?.abort()
    setIsStreaming(false)
    setMessages([])
    setArtifact(null)
    setInput('')
  }

  return (
    <div className='flex h-screen min-w-0 bg-background'>
      {/* Chat pane */}
      <div className='flex min-w-0 flex-1 flex-col border-border/40 border-r'>
        <div className='flex flex-shrink-0 items-center gap-3 border-border/40 border-b bg-card/30 px-5 py-3.5'>
          <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
            <Sparkles className='h-4 w-4 text-primary' />
          </div>
          <div>
            <h1 className='font-semibold text-[15px] leading-none'>ZelaxyArena</h1>
            <p className='mt-1 text-[12px] text-muted-foreground'>
              Describe what you want — it knows your workspace and takes action.
            </p>
          </div>
          <div className='ml-auto flex items-center gap-2'>
            <ModelPicker value={model} onChange={setModel} disabled={isStreaming} />
            {messages.length > 0 && (
              <Button
                variant='outline'
                size='sm'
                className='h-8'
                onClick={newChat}
                disabled={isStreaming}
              >
                <Plus className='mr-1.5 h-3.5 w-3.5' />
                New chat
              </Button>
            )}
          </div>
        </div>

        {missingCreds.length > 0 && (
          <div className='flex flex-shrink-0 flex-col gap-2 border-amber-500/30 border-b bg-amber-500/10 px-5 py-2.5'>
            <span className='text-[12px] text-foreground'>
              {missingCreds.length > 1
                ? 'This model’s provider needs credentials. Add them to run it:'
                : 'No API key for this model. Add it to run:'}
            </span>
            <div className='flex flex-wrap items-end gap-2'>
              {missingCreds.map((c) => (
                <div key={c.name} className='flex flex-col gap-0.5'>
                  <label className='text-[10px] text-muted-foreground' htmlFor={`cred-${c.name}`}>
                    {c.label}
                    {c.optional ? ' (optional)' : ''}
                  </label>
                  <Input
                    id={`cred-${c.name}`}
                    type={c.name.includes('REGION') ? 'text' : 'password'}
                    value={keyInputs[c.name] || ''}
                    onChange={(e) =>
                      setKeyInputs((prev) => ({ ...prev, [c.name]: e.target.value }))
                    }
                    placeholder={c.placeholder || c.name}
                    className='h-7 w-[220px] text-xs'
                  />
                </div>
              ))}
              <Button
                size='sm'
                className='h-7'
                onClick={saveKey}
                disabled={
                  savingKey ||
                  !missingCreds
                    .filter((c) => !c.optional)
                    .every((c) => (keyInputs[c.name] || '').trim())
                }
              >
                {savingKey ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        )}

        <div ref={scrollRef} className='min-h-0 flex-1 overflow-auto'>
          <div className='mx-auto w-full max-w-3xl px-4 py-6'>
            {messages.length === 0 ? (
              <div className='flex flex-col items-center gap-5 pt-10 text-center'>
                <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10'>
                  <Sparkles className='h-7 w-7 text-primary' />
                </div>
                <div>
                  <p className='font-medium text-foreground'>What can I build for you?</p>
                  <p className='mt-1 text-muted-foreground text-sm'>
                    Build workflows, inspect your workspace, manage environment variables, and more.
                  </p>
                </div>
                <div className='grid w-full max-w-xl gap-2 sm:grid-cols-2'>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type='button'
                      onClick={() => send(s)}
                      className='rounded-xl border border-border/60 bg-card/40 px-3 py-2.5 text-left text-[13px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground'
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className='space-y-5'>
                {messages.map((m) => (
                  <div key={m.id} className={cn('flex gap-3', m.role === 'user' && 'justify-end')}>
                    {m.role === 'assistant' && (
                      <div className='flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10'>
                        <Bot className='h-4 w-4 text-primary' />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-foreground'
                      )}
                    >
                      {m.tools && m.tools.length > 0 && (
                        <div className='mb-2 space-y-1'>
                          {m.tools.map((t) => (
                            <div
                              key={t.id}
                              className='flex items-center gap-2 rounded-lg border border-border/50 bg-background/60 px-2 py-1 text-[12px]'
                            >
                              {t.status === 'running' ? (
                                <Loader2 className='h-3 w-3 animate-spin text-primary' />
                              ) : t.status === 'error' ? (
                                <Wrench className='h-3 w-3 text-destructive' />
                              ) : (
                                <Wrench className='h-3 w-3 text-emerald-500' />
                              )}
                              <span className='text-muted-foreground'>
                                {prettyToolName(t.name)}
                              </span>
                              {t.status === 'error' && t.summary && (
                                <span className='truncate text-destructive'>· {t.summary}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {m.content ? (
                        m.role === 'assistant' ? (
                          <div className='copilot-markdown text-sm'>
                            <CopilotMarkdownRenderer content={m.content} />
                          </div>
                        ) : (
                          <span className='whitespace-pre-wrap'>{m.content}</span>
                        )
                      ) : (
                        m.role === 'assistant' &&
                        isStreaming && (
                          <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className='flex-shrink-0 border-border/40 border-t bg-background px-4 py-3'>
          <div className='mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-border/60 bg-card/40 px-3 py-2 focus-within:border-primary/40'>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(input)
                }
              }}
              placeholder='Describe what you want ZelaxyArena to do…'
              rows={1}
              className='max-h-40 min-h-[24px] flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0'
            />
            {isStreaming ? (
              <Button size='icon' variant='ghost' className='h-8 w-8' onClick={stop}>
                <span className='h-3 w-3 rounded-[2px] bg-foreground' />
              </Button>
            ) : (
              <Button
                size='icon'
                className='h-8 w-8 rounded-full'
                disabled={!input.trim()}
                onClick={() => send(input)}
              >
                <ArrowUp className='h-4 w-4' />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Resource panel */}
      <div className='hidden w-[42%] min-w-[320px] max-w-[640px] flex-col bg-card/20 lg:flex'>
        <div className='flex flex-shrink-0 items-center gap-2 border-border/40 border-b px-4 py-3.5'>
          <Network className='h-4 w-4 text-muted-foreground' />
          <span className='font-medium text-[13px]'>Resource panel</span>
        </div>
        <div className='min-h-0 flex-1 overflow-auto p-4'>
          {artifact ? (
            <div className='space-y-3'>
              <div className='flex items-center justify-between gap-2'>
                <h2 className='truncate font-medium text-sm'>{artifact.title}</h2>
                {artifact.workflowId ? (
                  <Button
                    size='sm'
                    onClick={() =>
                      router.push(`/arena/${workspaceId}/zelaxy/${artifact.workflowId}`)
                    }
                  >
                    Open in editor
                  </Button>
                ) : (
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => router.push(`/arena/${workspaceId}/hub?tab=tables`)}
                  >
                    Open Hub
                  </Button>
                )}
              </div>
              {artifact.workflowId && (
                <p className='rounded-lg border border-emerald-200/60 bg-emerald-50/50 px-3 py-2 text-[12px] text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300'>
                  ✓ Created and saved to your workspace — click “Open in editor” to view it on the
                  canvas.
                </p>
              )}
              {artifact.yaml && (
                <pre className='overflow-auto rounded-xl border border-border/50 bg-background/60 p-3 text-[12px] text-muted-foreground'>
                  {artifact.yaml}
                </pre>
              )}
            </div>
          ) : (
            <div className='flex h-full flex-col items-center justify-center gap-2 text-center'>
              <Network className='h-8 w-8 text-muted-foreground/50' />
              <p className='text-muted-foreground text-sm'>
                Workflows, tables, and files you create will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ZelaxyArena
