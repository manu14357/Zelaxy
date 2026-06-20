'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bot, History, Loader2, Plus, Sparkles, Trash2, Wrench } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'
import {
  ArenaComposer,
  type ArenaImageAttachment,
} from '@/app/arena/[workspaceId]/zelaxyarena/arena-composer'
import {
  ArenaResourcePanel,
  type ConsoleEntry,
  type ResourceArtifact,
} from '@/app/arena/[workspaceId]/zelaxyarena/arena-resource-panel'
import { ModelPicker } from '@/app/arena/[workspaceId]/zelaxyarena/model-picker'
import { SmoothStreamingText } from '@/app/arena/[workspaceId]/zelaxyarena/smooth-streaming-text'
import { splitThinking, ThinkingBlock } from '@/app/arena/[workspaceId]/zelaxyarena/thinking-block'
import { DEFAULT_CHAT_MODEL } from '@/providers/models'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'

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
  /** Enriched content sent to the model (context preamble + parsed attachments); display uses `content`. */
  apiContent?: string
  tools?: ToolAction[]
  /** Native extended-thinking reasoning streamed from capable models (separate from the answer). */
  reasoning?: string
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
  const workspaceId = params.workspaceId as string

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [artifacts, setArtifacts] = useState<ResourceArtifact[]>([])
  // Live console feed (tool calls + results) shown in the resource panel's Console tab.
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([])
  const [model, setModel] = useState<string>(DEFAULT_CHAT_MODEL)
  // 'agent' takes actions; 'ask' answers/plans without executing tools.
  const [mode, setMode] = useState<'agent' | 'ask'>('agent')
  // Dynamic API-key check: when the selected model's provider lacks credentials, prompt for the
  // missing fields (some providers need more than one — e.g. AWS Bedrock).
  const [missingCreds, setMissingCreds] = useState<MissingCred[]>([])
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({})
  const [savingKey, setSavingKey] = useState(false)
  // Persisted conversation history.
  const [chatId, setChatId] = useState<string | null>(null)
  const [chatList, setChatList] = useState<Array<{ id: string; title: string; updatedAt: string }>>(
    []
  )
  const [showHistory, setShowHistory] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const messagesRef = useRef<ChatMessage[]>([])
  const chatIdRef = useRef<string | null>(null)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])
  useEffect(() => {
    chatIdRef.current = chatId
  }, [chatId])
  const prevStreamingRef = useRef(false)

  // Smart auto-scroll: only follow the stream when the user is already near the bottom, so manual
  // scroll-up to re-read earlier messages isn't yanked back down (matches Agie's behaviour).
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (nearBottom) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // Load the conversation list on mount.
  const loadChatList = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await fetch(`/api/zelaxy-arena/chats?workspaceId=${workspaceId}`)
      if (res.ok) setChatList((await res.json()).chats ?? [])
    } catch {
      /* ignore */
    }
  }, [workspaceId])

  useEffect(() => {
    loadChatList()
  }, [loadChatList])

  // Persist the current conversation (create on first save, update afterward).
  const persistChat = useCallback(async () => {
    const msgs = messagesRef.current.filter((m) => m.content || m.tools?.length)
    if (msgs.length === 0) return
    const payload = msgs.map((m) => ({ role: m.role, content: m.content, tools: m.tools }))
    try {
      if (chatIdRef.current) {
        await fetch(`/api/zelaxy-arena/chats/${chatIdRef.current}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: payload }),
        })
      } else {
        const res = await fetch('/api/zelaxy-arena/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId, messages: payload }),
        })
        if (res.ok) {
          const d = await res.json()
          chatIdRef.current = d.id
          setChatId(d.id)
        }
      }
      loadChatList()
    } catch {
      /* ignore */
    }
  }, [workspaceId, loadChatList])

  // Persist once a streamed turn finishes — by now the messages ref holds the final assistant text.
  useEffect(() => {
    if (prevStreamingRef.current && !isStreaming) void persistChat()
    prevStreamingRef.current = isStreaming
  }, [isStreaming, persistChat])

  // Load a past conversation into the view.
  const loadChat = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/zelaxy-arena/chats/${id}`)
      if (!res.ok) return
      const { chat } = await res.json()
      const loaded: ChatMessage[] = (chat.messages || []).map((m: any) => ({
        id: crypto.randomUUID(),
        role: m.role,
        content: m.content,
        tools: m.tools,
      }))
      setMessages(loaded)
      setChatId(id)
      chatIdRef.current = id
      setArtifacts([])
      setConsoleEntries([])
      setShowHistory(false)
    } catch {
      /* ignore */
    }
  }, [])

  const deleteChat = useCallback(async (id: string) => {
    try {
      await fetch(`/api/zelaxy-arena/chats/${id}`, { method: 'DELETE' })
    } finally {
      setChatList((prev) => prev.filter((c) => c.id !== id))
      if (chatIdRef.current === id) {
        chatIdRef.current = null
        setChatId(null)
        setMessages([])
      }
    }
  }, [])

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
      // GET returns { data: { NAME: { key, value } } } — flatten to { NAME: value } so we MERGE
      // with (not overwrite) the user's existing variables.
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
        setMissingCreds([])
        setKeyInputs({})
      }
    } finally {
      setSavingKey(false)
    }
  }, [keyInputs, missingCreds])

  const send = useCallback(
    async (text: string, apiText?: string, attachments?: ArenaImageAttachment[]) => {
      const trimmed = text.trim()
      if (!trimmed || isStreaming) return

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        apiContent: apiText?.trim() ? apiText : undefined,
      }
      const assistantId = crypto.randomUUID()
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        tools: [],
      }

      const history = [...messages, userMsg]
      setMessages([...history, assistantMsg])
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
            mode,
            messages: history.map((m) => ({ role: m.role, content: m.apiContent ?? m.content })),
            ...(attachments?.length ? { attachments } : {}),
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
            } else if (event.type === 'reasoning') {
              updateAssistant((m) => ({
                ...m,
                reasoning: (m.reasoning || '') + (event.data || ''),
              }))
            } else if (event.type === 'tool_call') {
              const t: ToolAction = {
                id: event.data?.id || crypto.randomUUID(),
                name: event.data?.name || 'tool',
                status: 'running',
              }
              updateAssistant((m) => ({ ...m, tools: [...(m.tools || []), t] }))
              setConsoleEntries((prev) => [
                ...prev,
                {
                  id: t.id,
                  name: t.name,
                  status: 'running',
                  startedAt: Date.now(),
                  args: event.data?.arguments
                    ? JSON.stringify(event.data.arguments, null, 2).slice(0, 2000)
                    : undefined,
                },
              ])
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
              setConsoleEntries((prev) =>
                prev.map((e) =>
                  e.id === event.toolCallId
                    ? {
                        ...e,
                        status: event.success ? 'done' : 'error',
                        endedAt: Date.now(),
                        error: event.error || undefined,
                        result:
                          event.success && event.result
                            ? String(event.result).slice(0, 2000)
                            : e.result,
                      }
                    : e
                )
              )
              // Surface created resources (workflows, tables, files) into the resource panel.
              if (event.success) {
                try {
                  const data = JSON.parse(event.result || '{}')
                  if (
                    (toolName === 'build_workflow' || toolName === 'edit_workflow') &&
                    data.yamlContent
                  ) {
                    // Each build replaces ALL prior workflow cards (drop stale ones so
                    // "Open in editor" always points at the workflow just built). Tables/files kept.
                    setArtifacts((prev) => [
                      {
                        id: 'workflow:pending',
                        kind: 'workflow',
                        title: data.description || 'Generated workflow',
                        yaml: data.yamlContent,
                        workflowState: data.workflowState,
                      },
                      ...prev.filter((a) => a.kind !== 'workflow'),
                    ])
                  } else if (toolName === 'create_table' && data.id) {
                    setArtifacts((prev) => [
                      {
                        id: `table:${data.id}`,
                        kind: 'table',
                        title: data.name || 'New table',
                        subtitle: Array.isArray(data.columns)
                          ? `${data.columns.length} columns`
                          : undefined,
                      },
                      ...prev.filter((a) => a.id !== `table:${data.id}`),
                    ])
                  } else if (toolName === 'file_write' && data.id) {
                    setArtifacts((prev) => [
                      {
                        id: `file:${data.id}`,
                        kind: 'file',
                        title: data.name || 'New file',
                        url: data.url,
                      },
                      ...prev.filter((a) => a.id !== `file:${data.id}`),
                    ])
                  }
                } catch (e) {
                  logger.warn('Failed to parse tool result for resource panel', { e })
                }
              }
            } else if (event.type === 'workflow_created') {
              // The agent persisted a real, openable workflow — upgrade the pending workflow card.
              setArtifacts((prev) => {
                const pending = prev.find((a) => a.kind === 'workflow' && !a.workflowId)
                const upgraded: ResourceArtifact = {
                  id: `workflow:${event.workflowId}`,
                  kind: 'workflow',
                  title: event.name || pending?.title || 'New workflow',
                  yaml: pending?.yaml,
                  workflowState: pending?.workflowState,
                  workflowId: event.workflowId,
                }
                return [upgraded, ...prev.filter((a) => a !== pending)]
              })
              // Refresh the global workflow registry so the new workflow shows in the editor/sidebar
              // immediately (without a page reload).
              void useWorkflowRegistry.getState().loadWorkflows(workspaceId)
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
        // Persistence happens in an effect once streaming ends, so the final assistant text
        // (set just before this) is included rather than a stale snapshot.
      }
    },
    [messages, isStreaming, workspaceId, model, mode]
  )

  const stop = () => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }

  const newChat = () => {
    abortRef.current?.abort()
    setIsStreaming(false)
    setMessages([])
    setArtifacts([])
    setConsoleEntries([])
    setChatId(null)
    chatIdRef.current = null
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
            {/* Ask / Agent mode toggle */}
            <div className='flex items-center rounded-lg border border-border/60 bg-card/40 p-0.5'>
              {(['agent', 'ask'] as const).map((mo) => (
                <button
                  key={mo}
                  type='button'
                  disabled={isStreaming}
                  onClick={() => setMode(mo)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-[12px] capitalize transition-colors disabled:opacity-50',
                    mode === mo
                      ? 'bg-background font-medium text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title={
                    mo === 'agent'
                      ? 'Agent — takes actions (builds, runs, edits)'
                      : 'Ask — answers and plans without taking actions'
                  }
                >
                  {mo}
                </button>
              ))}
            </div>
            <ModelPicker value={model} onChange={setModel} disabled={isStreaming} />
            {/* History */}
            <div className='relative'>
              <Button
                variant='outline'
                size='sm'
                className='h-8'
                onClick={() => {
                  setShowHistory((s) => !s)
                  if (!showHistory) loadChatList()
                }}
                title='Conversation history'
              >
                <History className='mr-1.5 h-3.5 w-3.5' />
                History
              </Button>
              {showHistory && (
                <div className='absolute right-0 z-20 mt-1 max-h-80 w-72 overflow-auto rounded-lg border border-border/60 bg-popover p-1 shadow-lg'>
                  {chatList.length === 0 ? (
                    <p className='px-3 py-4 text-center text-[12px] text-muted-foreground'>
                      No past conversations.
                    </p>
                  ) : (
                    chatList.map((c) => (
                      <div
                        key={c.id}
                        className={cn(
                          'group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60',
                          c.id === chatId && 'bg-muted/40'
                        )}
                      >
                        <button
                          type='button'
                          className='min-w-0 flex-1 truncate text-left text-[13px]'
                          onClick={() => loadChat(c.id)}
                        >
                          {c.title}
                        </button>
                        <button
                          type='button'
                          className='opacity-0 group-hover:opacity-100'
                          onClick={() => deleteChat(c.id)}
                          title='Delete'
                        >
                          <Trash2 className='h-3.5 w-3.5 text-muted-foreground hover:text-destructive' />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
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
                {messages.map((m, i) => (
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
                          (() => {
                            const streamingThis = isStreaming && i === messages.length - 1
                            const parsed = splitThinking(m.content)
                            // Prefer native extended-thinking reasoning (streamed separately);
                            // fall back to <thinking> parsed from the answer for prompt-based models.
                            const thinking = m.reasoning?.length ? m.reasoning : parsed.thinking
                            const text = parsed.text
                            return (
                              <div className='copilot-markdown text-sm'>
                                {thinking && (
                                  <ThinkingBlock
                                    content={thinking}
                                    isActive={streamingThis && text.length === 0}
                                  />
                                )}
                                {text.length > 0 && (
                                  <SmoothStreamingText content={text} isStreaming={streamingThis} />
                                )}
                              </div>
                            )
                          })()
                        ) : (
                          <span className='whitespace-pre-wrap'>{m.content}</span>
                        )
                      ) : (
                        m.role === 'assistant' &&
                        isStreaming &&
                        i === messages.length - 1 && (
                          <div className='flex items-center gap-1.5 text-muted-foreground'>
                            <span className='inline-flex gap-1'>
                              <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]' />
                              <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]' />
                              <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-current' />
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Composer — @-mentions + file attachments */}
        <ArenaComposer
          workspaceId={workspaceId}
          isStreaming={isStreaming}
          onSend={(displayText, apiText) => send(displayText, apiText)}
          onStop={stop}
        />
      </div>

      {/* Live session panel — tabbed canvas / resources / console */}
      <ArenaResourcePanel
        workspaceId={workspaceId}
        artifacts={artifacts}
        consoleEntries={consoleEntries}
        isStreaming={isStreaming}
      />
    </div>
  )
}

export default ZelaxyArena
