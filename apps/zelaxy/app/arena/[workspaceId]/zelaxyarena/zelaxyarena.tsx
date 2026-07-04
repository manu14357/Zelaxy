'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Database,
  FileText,
  History,
  Loader2,
  type LucideIcon,
  Network,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Table as TableIcon,
  Trash2,
  Wrench,
  XCircle,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'
import CopilotMarkdownRenderer from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/panel/components/copilot/components/copilot-message/components/markdown-renderer'
import {
  AttachmentPreview,
  type MessageAttachment,
} from '@/app/arena/[workspaceId]/zelaxyarena/arena-attachment-preview'
import {
  ArenaComposer,
  type ArenaContext,
  type ArenaImageAttachment,
} from '@/app/arena/[workspaceId]/zelaxyarena/arena-composer'
import {
  ArenaResourcePanel,
  type ConsoleEntry,
  type ResourceArtifact,
} from '@/app/arena/[workspaceId]/zelaxyarena/arena-resource-panel'
import { ModelPicker } from '@/app/arena/[workspaceId]/zelaxyarena/model-picker'
import { splitThinking, ThinkingBlock } from '@/app/arena/[workspaceId]/zelaxyarena/thinking-block'
import { resolveToolStatusTitle } from '@/app/arena/[workspaceId]/zelaxyarena/tool-status'
import { DEFAULT_CHAT_MODEL } from '@/providers/models'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'

const logger = createLogger('ZelaxyArena')

// Console payload cap — generous so full tool output is visible (the box is collapsible), while still
// guarding against a pathological multi-MB string freezing the UI.
const CONSOLE_MAX_CHARS = 100_000

/** One stable slot for the document being streamed. The placeholder (before the filename is known)
 * and the finalized file share this id so they render as a SINGLE tab, not two. On completion the
 * artifact is re-keyed to its permanent `file:<id>` and this slot is freed for the next file. */
const STREAMING_FILE_ID = 'file:__streaming__'

/** Pretty-print a value (parsing JSON strings) so console input AND output render the same way. */
function prettyJson(val: unknown): string {
  if (val == null) return ''
  if (typeof val === 'string') {
    try {
      return JSON.stringify(JSON.parse(val), null, 2)
    } catch {
      return val
    }
  }
  try {
    return JSON.stringify(val, null, 2)
  } catch {
    return String(val)
  }
}

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
  /** Raw tool arguments — used to derive a contextual status title (e.g. the search query). */
  args?: any
}

/**
 * An ordered piece of an assistant turn: either a run of narration text, or a single tool call.
 * The stream delivers these interleaved (text → tools → text → tools …); rendering preserves order
 * and groups consecutive tool calls under their derived "agent" — the reference's messaging flow.
 */
type MessagePart = { type: 'text'; content: string } | { type: 'tool'; tool: ToolAction }

interface AgentInfo {
  id: string
  label: string
  icon: LucideIcon
}

/** Map a tool id to the named "agent" that owns it, mirroring the reference's subagent labels. */
function agentForTool(name: string): AgentInfo {
  const research = [
    'search_online',
    'scrape_page',
    'crawl_website',
    'search_documentation',
    'get_page_contents',
    'deep_research',
  ]
  const file = ['create_file', 'append_file', 'write_file']
  if (research.includes(name)) return { id: 'research', label: 'Research Agent', icon: Search }
  if (file.includes(name)) return { id: 'file', label: 'File Agent', icon: FileText }
  if (name.includes('knowledge'))
    return { id: 'knowledge', label: 'Knowledge Agent', icon: Database }
  if (name.includes('table')) return { id: 'table', label: 'Table Agent', icon: TableIcon }
  if (name.includes('environment') || name.includes('scheduled'))
    return { id: 'config', label: 'Config Agent', icon: Settings2 }
  if (
    name.includes('workflow') ||
    name === 'get_blocks_and_tools' ||
    name === 'get_blocks_metadata'
  )
    return { id: 'workflow', label: 'Workflow Agent', icon: Network }
  return { id: 'tools', label: 'Tools Agent', icon: Wrench }
}

/** A step inside an agent group: a tool call, or a line of the agent's own (dimmed) narration. */
type GroupItem = { type: 'tool'; tool: ToolAction } | { type: 'text'; content: string }

/**
 * A named, collapsible agent group — icon + agent label + chevron, with its steps listed underneath
 * (indented, like the reference's "File Agent" / "Research Agent" blocks). Steps are tool calls AND
 * any narration the agent emitted while working (shown dimmed, the reference's in-group text). Auto-
 * expands while live and still working; collapses once every step is done. A click pins it.
 */
function AgentGroup({
  agent,
  items,
  active,
}: {
  agent: AgentInfo
  items: GroupItem[]
  active: boolean
}) {
  const tools = items.filter((i): i is { type: 'tool'; tool: ToolAction } => i.type === 'tool')
  const anyRunning = tools.some((i) => i.tool.status === 'running')
  // Stay expanded for the whole live turn so the user can watch each step + narration appear; once
  // the turn finishes (no longer active) the group auto-collapses to a tidy header. A click pins it.
  const [manual, setManual] = useState<boolean | null>(null)
  const expanded = manual ?? active
  const Icon = agent.icon

  return (
    <div className='flex flex-col gap-1.5'>
      <button
        type='button'
        onClick={() => setManual(!expanded)}
        className='flex w-fit cursor-pointer items-center gap-2 text-left'
      >
        <span className='flex size-4 flex-shrink-0 items-center justify-center'>
          {anyRunning ? (
            <Loader2 className='size-[15px] animate-spin text-muted-foreground' />
          ) : (
            <Icon className='size-4 text-muted-foreground' />
          )}
        </span>
        <span className='text-foreground text-sm'>{agent.label}</span>
        <ChevronDown
          className={cn(
            'h-[7px] w-[9px] text-muted-foreground transition-transform duration-150',
            !expanded && '-rotate-90'
          )}
        />
      </button>
      {expanded && (
        <div className='flex flex-col gap-1.5 py-0.5'>
          {items.map((item, i) =>
            item.type === 'tool' ? (
              <div key={item.tool.id} className='flex items-center gap-[8px] pl-[24px]'>
                <span className='flex size-4 flex-shrink-0 items-center justify-center'>
                  {item.tool.status === 'running' ? (
                    <Loader2 className='size-[15px] animate-spin text-muted-foreground' />
                  ) : item.tool.status === 'error' ? (
                    <XCircle className='size-[15px] text-destructive' />
                  ) : (
                    <CheckCircle2 className='size-[15px] text-muted-foreground' />
                  )}
                </span>
                {/* Title + (optional) error on ONE truncating line so a long URL + error message
                    never wraps/overflows the row; the full error stays in the Console. */}
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-[13px]',
                    item.tool.status === 'error' ? 'text-destructive' : 'text-muted-foreground'
                  )}
                  title={
                    item.tool.status === 'error' && item.tool.summary
                      ? item.tool.summary
                      : undefined
                  }
                >
                  {resolveToolStatusTitle(item.tool.name, item.tool.status, item.tool.args)}
                  {item.tool.status === 'error' && item.tool.summary ? (
                    <span className='text-destructive/70'> · {item.tool.summary}</span>
                  ) : null}
                </span>
              </div>
            ) : (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: in-group narration has no stable id
                key={`gt${i}`}
                className='whitespace-pre-wrap pl-[24px] text-[13px] text-muted-foreground leading-[18px] opacity-60'
              >
                {item.content.trim()}
              </span>
            )
          )}
        </div>
      )}
    </div>
  )
}

/** One narration segment — markdown, with inline <thinking> peeled into a thinking block. Renders
 * the markdown DIRECTLY (the server already streams the text token-by-token, so the text grows live
 * as deltas arrive — no client-side reveal needed; the earlier RAF reveal failed to paint mid-stream
 * which is why narration only appeared on stop). `[&_p]:my-0` keeps it tight against agent groups. */
function TextSegment({ content, streaming }: { content: string; streaming: boolean }) {
  const parsed = splitThinking(content)
  if (!parsed.thinking && parsed.text.length === 0) return null
  return (
    <div className='copilot-markdown text-sm [&_ol]:my-1 [&_p]:my-0 [&_ul]:my-1'>
      {parsed.thinking && (
        <ThinkingBlock content={parsed.thinking} isActive={streaming && parsed.text.length === 0} />
      )}
      {parsed.text.length > 0 && <CopilotMarkdownRenderer content={parsed.text} />}
    </div>
  )
}

/**
 * Render an assistant turn as the reference does: narration text and named agent groups interleaved
 * in arrival order. Consecutive tool calls owned by the same agent collapse into one group.
 */
function MessageParts({ message, isActive }: { message: ChatMessage; isActive: boolean }) {
  // Fallback for older messages (e.g. loaded from history) that only carry a content string.
  const parts: MessagePart[] =
    message.parts && message.parts.length > 0
      ? message.parts
      : message.content
        ? [{ type: 'text', content: message.content }]
        : []

  type Segment =
    | { kind: 'text'; content: string; key: string }
    | { kind: 'group'; agent: AgentInfo; items: GroupItem[]; key: string }
  const segments: Segment[] = []

  // Narration is ALWAYS a top-level segment (stable + always visible — no tucking into groups, which
  // caused it to flicker out of view mid-stream). A run of consecutive same-agent tool calls (with no
  // narration between them) merges into ONE named group; a line of narration ends the current run, so
  // the next tools start a fresh group — exactly the reference's "text → group → text → group" flow.
  parts.forEach((part, idx) => {
    if (part.type === 'tool') {
      const agent = agentForTool(part.tool.name)
      const last = segments[segments.length - 1]
      if (last && last.kind === 'group' && last.agent.id === agent.id) {
        last.items.push({ type: 'tool', tool: part.tool })
      } else {
        segments.push({
          kind: 'group',
          agent,
          items: [{ type: 'tool', tool: part.tool }],
          key: `g${idx}`,
        })
      }
      return
    }
    if (part.content.trim()) segments.push({ kind: 'text', content: part.content, key: `t${idx}` })
  })

  return (
    <div className='flex flex-col gap-[10px]'>
      {segments.map((seg) =>
        seg.kind === 'group' ? (
          <AgentGroup key={seg.key} agent={seg.agent} items={seg.items} active={isActive} />
        ) : (
          <TextSegment key={seg.key} content={seg.content} streaming={isActive} />
        )
      )}
    </div>
  )
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** Enriched content sent to the model (context preamble + parsed attachments); display uses `content`. */
  apiContent?: string
  tools?: ToolAction[]
  /** Ordered narration + tool parts, interleaved as they streamed — the source for rendering. */
  parts?: MessagePart[]
  /** Native extended-thinking reasoning streamed from capable models (separate from the answer). */
  reasoning?: string
  /** Set when the user stopped this turn mid-stream. */
  stopped?: boolean
  /** Files the user attached to this message — rendered as image thumbnails / file chips. */
  attachments?: MessageAttachment[]
}

const SUGGESTIONS = [
  'Build a workflow that scrapes a URL, summarizes it with Claude, and posts to Slack',
  'List the workflows in this workspace and what each one does',
  'What environment variables are configured in this workspace?',
  'Create a lead-enrichment workflow that writes results to a table',
]

/** "Building with ZelaxyArena" — the capability categories shown on the empty state. */
const CAPABILITIES: { icon: typeof Network; label: string; description: string }[] = [
  {
    icon: Network,
    label: 'Workflows',
    description: 'Build and edit automations on the canvas from a plain-language description.',
  },
  {
    icon: Search,
    label: 'Research',
    description:
      'Research anything — it figures out the best approach: searching the web, reading specific pages, crawling sites, and looking up technical docs.',
  },
  {
    icon: FileText,
    label: 'Files & documents',
    description: 'Create and edit documents and files in your workspace, or read ones you upload.',
  },
  {
    icon: TableIcon,
    label: 'Tables',
    description: 'Create data tables, query them, and add, update, or export rows.',
  },
  {
    icon: Settings2,
    label: 'Automation & configuration',
    description:
      'Schedule recurring runs, manage environment variables and secrets, and connect accounts.',
  },
  {
    icon: Database,
    label: 'Knowledge bases',
    description: 'Create knowledge bases and search them to ground answers in your own content.',
  },
]

// Per-workspace key under which the active ZelaxyArena chat id is remembered. Navigating to a
// table/workflow/file and back remounts this component with empty state; persisting the active chat
// id lets us restore the exact session instead of opening a blank "new chat" panel.
const lastChatKey = (workspaceId: string) => `zelaxyarena:last-chat:${workspaceId}`

export function ZelaxyArena() {
  const params = useParams()
  const workspaceId = params.workspaceId as string

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>(SUGGESTIONS)
  // Messages the user sent while a turn was still streaming — auto-dispatched when it finishes.
  const [queued, setQueued] = useState<
    {
      text: string
      apiText?: string
      attachments?: ArenaImageAttachment[]
      contexts?: ArenaContext[]
      displayAttachments?: MessageAttachment[]
    }[]
  >([])
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
  const artifactsRef = useRef<ResourceArtifact[]>([])
  const consoleRef = useRef<ConsoleEntry[]>([])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])
  useEffect(() => {
    artifactsRef.current = artifacts
  }, [artifacts])
  useEffect(() => {
    consoleRef.current = consoleEntries
  }, [consoleEntries])
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
    const msgs = messagesRef.current.filter(
      (m) => m.content || m.tools?.length || m.parts?.length || m.attachments?.length
    )
    if (msgs.length === 0) return
    // Persist the structured render data too (parts = agent groups + interleaved narration,
    // reasoning = thinking) so reopening from History replays the full turn, not just the final text.
    const payload = msgs.map((m) => ({
      role: m.role,
      content: m.content,
      tools: m.tools,
      parts: m.parts,
      reasoning: m.reasoning,
      // Persist lightweight metadata only — the live object-URL preview can't survive a reload, so
      // restored attachments render as file chips (the name/type/size are enough to identify them).
      attachments: m.attachments?.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        size: a.size,
      })),
    }))
    const artifactsPayload = artifactsRef.current
    const consolePayload = consoleRef.current
    try {
      if (chatIdRef.current) {
        await fetch(`/api/zelaxy-arena/chats/${chatIdRef.current}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: payload,
            artifacts: artifactsPayload,
            consoleEntries: consolePayload,
          }),
        })
      } else {
        // Derive a tidy title from the first user message (word-boundary trim) instead of a raw slice.
        const firstUser = msgs.find((m) => m.role === 'user')?.content?.trim() || 'New chat'
        const title =
          firstUser.length > 48
            ? `${firstUser
                .slice(0, 48)
                .replace(/\s+\S*$/, '')
                .trim()}…`
            : firstUser
        const res = await fetch('/api/zelaxy-arena/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            title,
            messages: payload,
            artifacts: artifactsPayload,
            consoleEntries: consolePayload,
          }),
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

  // Personalize the empty-state suggestions from what's actually in this workspace.
  useEffect(() => {
    let cancelled = false
    fetch(`/api/zelaxy-arena/contexts?workspaceId=${workspaceId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data?.contexts)) return
        const wf = data.contexts.filter((c: any) => c.type === 'workflow')
        const tbl = data.contexts.filter((c: any) => c.type === 'table')
        const personalized: string[] = []
        if (wf[0])
          personalized.push(`Explain and suggest improvements to my "${wf[0].label}" workflow`)
        if (tbl[0]) personalized.push(`Show me what's in the "${tbl[0].label}" table`)
        personalized.push(
          'Build a workflow that scrapes a URL, summarizes it with Claude, and posts to Slack'
        )
        personalized.push(
          wf.length > 0 ? 'List my workflows and what each one does' : 'What can you build for me?'
        )
        if (personalized.length > 0) setSuggestions(personalized.slice(0, 4))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [workspaceId])

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
        // Restore the structured render data so history replays the agent groups, interleaved
        // narration and thinking — not just the final text.
        parts: Array.isArray(m.parts) ? m.parts : undefined,
        reasoning: typeof m.reasoning === 'string' ? m.reasoning : undefined,
        attachments: Array.isArray(m.attachments) ? m.attachments : undefined,
      }))
      setMessages(loaded)
      setChatId(id)
      chatIdRef.current = id
      // Restore the live-session panel (workflow/table/file cards) + console/logs saved with the chat.
      setArtifacts(Array.isArray(chat.artifacts) ? chat.artifacts : [])
      setConsoleEntries(Array.isArray(chat.consoleEntries) ? chat.consoleEntries : [])
      setShowHistory(false)
    } catch {
      /* ignore */
    }
  }, [])

  const deleteChat = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/zelaxy-arena/chats/${id}`, { method: 'DELETE' })
      } finally {
        setChatList((prev) => prev.filter((c) => c.id !== id))
        if (chatIdRef.current === id) {
          chatIdRef.current = null
          setChatId(null)
          setMessages([])
          try {
            window.localStorage.removeItem(lastChatKey(workspaceId))
          } catch {
            /* ignore */
          }
        }
      }
    },
    [workspaceId]
  )

  // Restore the last active chat when returning to ZelaxyArena (e.g. after opening a table/workflow
  // and navigating back). The component remounts with empty state on route changes, so without this
  // the session is lost and a blank panel appears. Read localStorage inside an effect (not during
  // render) to stay hydration-safe, and guard so it runs only once per mount.
  const restoredRef = useRef(false)
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    try {
      const last = window.localStorage.getItem(lastChatKey(workspaceId))
      if (last) void loadChat(last)
    } catch {
      /* ignore */
    }
  }, [workspaceId, loadChat])

  // Remember which chat is active so the restore above can bring it back on return. Only writes a
  // real chat id; New chat / delete explicitly clear the key.
  useEffect(() => {
    if (!chatId) return
    try {
      window.localStorage.setItem(lastChatKey(workspaceId), chatId)
    } catch {
      /* ignore */
    }
  }, [chatId, workspaceId])

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
    async (
      text: string,
      apiText?: string,
      attachments?: ArenaImageAttachment[],
      contexts?: ArenaContext[],
      displayAttachments?: MessageAttachment[]
    ) => {
      const trimmed = text.trim()
      // Allow an attachments-only message (e.g. an image with no caption).
      if (!trimmed && !displayAttachments?.length) return
      // A turn is still streaming — queue this message instead of dropping it. It auto-sends when
      // the current turn finishes (see the auto-dispatch effect).
      if (isStreaming) {
        setQueued((q) => [
          ...q,
          { text: trimmed, apiText, attachments, contexts, displayAttachments },
        ])
        return
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        apiContent: apiText?.trim() ? apiText : undefined,
        attachments: displayAttachments?.length ? displayAttachments : undefined,
      }
      const assistantId = crypto.randomUUID()
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        tools: [],
      }

      // Build from the ref (always the latest committed messages) so a Retry that just truncated
      // the history is honoured immediately rather than using a stale closure snapshot.
      const history = [...messagesRef.current, userMsg]
      messagesRef.current = [...history, assistantMsg]
      setMessages([...history, assistantMsg])
      setIsStreaming(true)

      const updateAssistant = (fn: (m: ChatMessage) => ChatMessage) =>
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? fn(m) : m)))

      const controller = new AbortController()
      abortRef.current = controller

      // Pass the workflow currently shown in the Live Session so the agent can analyze / edit / run
      // "the workflow" the user is looking at — without needing an explicit @-mention. (persisted
      // workflows carry a real workflowId; the pending preview doesn't.)
      const activeWorkflowId = artifactsRef.current.find(
        (a) => a.kind === 'workflow' && a.workflowId
      )?.workflowId

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
            ...(contexts?.length ? { contexts } : {}),
            ...(activeWorkflowId ? { workflowId: activeWorkflowId } : {}),
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
              const data = event.data || ''
              updateAssistant((m) => {
                const parts = [...(m.parts ?? [])]
                const last = parts[parts.length - 1]
                if (last && last.type === 'text') {
                  parts[parts.length - 1] = { type: 'text', content: last.content + data }
                } else {
                  parts.push({ type: 'text', content: data })
                }
                return { ...m, content: m.content + data, parts }
              })
            } else if (event.type === 'segment_break') {
              // Force the next narration to start a fresh text part (separate from prior text).
              updateAssistant((m) => {
                const parts = [...(m.parts ?? [])]
                const last = parts[parts.length - 1]
                if (last && last.type === 'text' && last.content.trim()) {
                  parts.push({ type: 'text', content: '' })
                }
                return { ...m, parts }
              })
            } else if (event.type === 'file_stream') {
              // A document is being written by the model — stream its content LIVE into the side
              // panel (the file is persisted later when create_file actually runs). All deltas go to
              // ONE stable streaming slot; the filename often arrives AFTER the first content deltas,
              // so we start with a placeholder title and upgrade it in place — never a second tab.
              const delta = event.delta || ''
              setArtifacts((prev) => {
                const existing = prev.find((a) => a.id === STREAMING_FILE_ID)
                const title = event.name || existing?.title || 'Document.md'
                if (existing) {
                  return prev.map((a) =>
                    a.id === STREAMING_FILE_ID
                      ? { ...a, title, content: (a.content ?? '') + delta }
                      : a
                  )
                }
                return [
                  { id: STREAMING_FILE_ID, kind: 'file', title, content: delta, streaming: true },
                  ...prev,
                ]
              })
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
                args: event.data?.arguments,
              }
              updateAssistant((m) => ({
                ...m,
                tools: [...(m.tools || []), t],
                parts: [...(m.parts ?? []), { type: 'tool', tool: t }],
              }))
              setConsoleEntries((prev) => [
                ...prev,
                {
                  id: t.id,
                  name: t.name,
                  status: 'running',
                  startedAt: Date.now(),
                  args: event.data?.arguments
                    ? prettyJson(event.data.arguments).slice(0, CONSOLE_MAX_CHARS)
                    : undefined,
                },
              ])
              // Live document: as soon as a file write begins, show the doc in the side panel from
              // the streamed arguments — so the document appears while "Creating file" runs.
              if (t.name === 'create_file' || t.name === 'append_file') {
                const a =
                  typeof t.args === 'string'
                    ? (() => {
                        try {
                          return JSON.parse(t.args)
                        } catch {
                          return null
                        }
                      })()
                    : t.args
                if (a && typeof a.content === 'string' && a.name) {
                  // Update the SAME streaming slot now that the real filename is known — the doc view
                  // stays mounted from "Creating file" through completion (no remount, no 2nd tab).
                  setArtifacts((prev) => {
                    const existing = prev.find((x) => x.id === STREAMING_FILE_ID)
                    if (existing) {
                      return prev.map((x) =>
                        x.id === STREAMING_FILE_ID
                          ? { ...x, title: a.name, content: a.content, streaming: true }
                          : x
                      )
                    }
                    return [
                      {
                        id: STREAMING_FILE_ID,
                        kind: 'file',
                        title: a.name,
                        content: a.content,
                        streaming: true,
                      },
                      ...prev,
                    ]
                  })
                }
              }
            } else if (event.type === 'tool_result') {
              const toolName = event.name
              const nextStatus: ToolAction['status'] = event.success ? 'done' : 'error'
              updateAssistant((m) => ({
                ...m,
                tools: (m.tools || []).map((t) =>
                  t.id === event.toolCallId
                    ? { ...t, status: nextStatus, summary: event.error || undefined }
                    : t
                ),
                parts: (m.parts ?? []).map((p) =>
                  p.type === 'tool' && p.tool.id === event.toolCallId
                    ? {
                        type: 'tool',
                        tool: { ...p.tool, status: nextStatus, summary: event.error || undefined },
                      }
                    : p
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
                            ? prettyJson(event.result).slice(0, CONSOLE_MAX_CHARS)
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
                  } else if (
                    (toolName === 'create_file' || toolName === 'append_file') &&
                    data.id
                  ) {
                    setArtifacts((prev) => {
                      // Re-key the streaming slot to its permanent, unique id and FREE the slot, so
                      // the placeholder + final file are one tab and the next file streams cleanly.
                      const fileId = `file:${data.id}`
                      const streaming = prev.find((a) => a.id === STREAMING_FILE_ID)
                      return [
                        {
                          id: fileId,
                          kind: 'file',
                          title: data.name || streaming?.title || 'New file',
                          url: data.url,
                          // Prefer the result's content; fall back to what we already streamed.
                          content:
                            typeof data.content === 'string' ? data.content : streaming?.content,
                          // Reveal already underway from the tool_call; don't restart it.
                          streaming: false,
                          subtitle:
                            typeof data.size === 'number'
                              ? `${(data.size / 1024).toFixed(1)} KB`
                              : undefined,
                        },
                        ...prev.filter((a) => a.id !== fileId && a.id !== STREAMING_FILE_ID),
                      ]
                    })
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
              // Make the new workflow show in the sidebar/list immediately. We optimistically add it
              // to the registry (a full re-fetch can be skipped by the registry's in-flight guard,
              // which is why it previously only appeared after a page reload), then reconcile.
              useWorkflowRegistry.setState((s) => ({
                workflows: {
                  ...s.workflows,
                  [event.workflowId]: {
                    id: event.workflowId,
                    name: event.name || 'New workflow',
                    lastModified: new Date(),
                    description: '',
                    color: '#3B82F6',
                    workspaceId,
                    folderId: null,
                  },
                },
              }))
              void useWorkflowRegistry.getState().loadWorkflows(workspaceId)
            } else if (event.type === 'error') {
              updateAssistant((m) => ({ ...m, content: `${m.content}\n\n⚠️ ${event.error}` }))
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          logger.error('ZelaxyArena stream error', { err })
          // Keep whatever streamed before the drop (it's persisted in the finally), and surface a
          // clear, recoverable state — the user can Retry to regenerate from the same prompt.
          updateAssistant((m) => ({
            ...m,
            content:
              `${m.content || ''}\n\n⚠️ The connection dropped before the response finished — press Retry to regenerate.`.trim(),
          }))
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

  // Auto-dispatch the next queued message once the current turn finishes streaming.
  useEffect(() => {
    if (!isStreaming && queued.length > 0) {
      const [head, ...rest] = queued
      setQueued(rest)
      void send(head.text, head.apiText, head.attachments, head.contexts, head.displayAttachments)
    }
  }, [isStreaming, queued, send])

  // Regenerate an assistant turn: drop it (and its prompting user message), then re-run that prompt.
  const retryAssistant = useCallback(
    (assistantIndex: number) => {
      if (isStreaming) return
      const msgs = messagesRef.current
      let ui = assistantIndex - 1
      while (ui >= 0 && msgs[ui].role !== 'user') ui--
      if (ui < 0) return
      const userMsg = msgs[ui]
      const truncated = msgs.slice(0, ui)
      messagesRef.current = truncated
      setMessages(truncated)
      void send(userMsg.content, userMsg.apiContent)
    },
    [isStreaming, send]
  )

  const stop = () => {
    abortRef.current?.abort()
    setIsStreaming(false)
    setQueued([])
    // Mark the in-flight assistant turn as stopped and flip any still-running tools to a final state.
    setMessages((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      if (last.role !== 'assistant') return prev
      const next = [...prev]
      next[next.length - 1] = {
        ...last,
        stopped: true,
        tools: last.tools?.map((t) =>
          t.status === 'running' ? { ...t, status: 'error', summary: 'Stopped' } : t
        ),
      }
      return next
    })
  }

  const newChat = () => {
    abortRef.current?.abort()
    setIsStreaming(false)
    setMessages([])
    setArtifacts([])
    setConsoleEntries([])
    setChatId(null)
    chatIdRef.current = null
    // Forget the remembered session so returning to ZelaxyArena keeps this fresh chat, not the old one.
    try {
      window.localStorage.removeItem(lastChatKey(workspaceId))
    } catch {
      /* ignore */
    }
  }

  return (
    <div className='flex h-screen min-w-0 bg-background'>
      {/* Chat pane */}
      <div className='arena-chat-pane flex min-w-0 flex-1 flex-col border-border/40 border-r'>
        <div className='flex flex-shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-border/40 border-b bg-card/30 px-3 py-3 sm:px-5 sm:py-3.5'>
          <div className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10'>
            <Sparkles className='h-4 w-4 text-primary' />
          </div>
          <div className='min-w-0'>
            <h1 className='font-semibold text-[15px] leading-none'>ZelaxyArena</h1>
            <p className='arena-header-desc mt-1 text-[12px] text-muted-foreground'>
              Describe what you want — it knows your workspace and takes action.
            </p>
          </div>
          <div className='ml-auto flex flex-wrap items-center gap-2'>
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
                  {suggestions.map((s) => (
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

                {/* Building with ZelaxyArena — what the workspace agent can do. */}
                <div className='w-full max-w-xl pt-2'>
                  <p className='mb-2 text-left font-medium text-[11px] text-muted-foreground uppercase tracking-wide'>
                    Building with ZelaxyArena
                  </p>
                  <div className='flex flex-col gap-1.5'>
                    {CAPABILITIES.map((c) => {
                      const Icon = c.icon
                      return (
                        <div
                          key={c.label}
                          className='flex items-start gap-3 rounded-xl border border-border/50 bg-card/30 px-3 py-2.5 text-left'
                        >
                          <div className='mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10'>
                            <Icon className='h-3.5 w-3.5 text-primary' />
                          </div>
                          <div>
                            <p className='font-medium text-[13px] text-foreground'>{c.label}</p>
                            <p className='text-[12px] text-muted-foreground leading-relaxed'>
                              {c.description}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
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
                        'group text-sm leading-relaxed',
                        m.role === 'user'
                          ? 'flex max-w-[85%] flex-col items-end gap-1.5'
                          : 'min-w-0 flex-1 pt-0.5 text-foreground'
                      )}
                    >
                      {m.role === 'assistant' ? (
                        (() => {
                          const streamingThis = isStreaming && i === messages.length - 1
                          const hasParts = Boolean(m.parts && m.parts.length > 0)
                          return (
                            <>
                              {/* Native extended-thinking (streamed separately from the answer). */}
                              {m.reasoning?.length ? (
                                <ThinkingBlock
                                  content={m.reasoning}
                                  isActive={streamingThis && !m.content}
                                />
                              ) : null}
                              {/* Narration text + named agent groups, interleaved in arrival order. */}
                              <MessageParts message={m} isActive={streamingThis} />
                              {/* Persistent activity indicator — stays visible for the WHOLE live
                                  turn (including the model's silent thinking pauses between tool
                                  rounds) so the user always knows ZelaxyArena is still working. */}
                              {streamingThis &&
                                (!hasParts && !m.content && !m.reasoning ? (
                                  <div className='flex items-center gap-1.5 text-muted-foreground'>
                                    <span className='inline-flex gap-1'>
                                      <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]' />
                                      <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]' />
                                      <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-current' />
                                    </span>
                                  </div>
                                ) : (
                                  <div className='mt-2 flex items-center gap-2 text-[13px] text-muted-foreground'>
                                    <Loader2 className='h-3.5 w-3.5 animate-spin' />
                                    <span>Working…</span>
                                  </div>
                                ))}
                            </>
                          )
                        })()
                      ) : (
                        <>
                          {m.attachments?.length ? (
                            <div className='flex flex-wrap justify-end gap-2'>
                              {m.attachments.map((a) => (
                                <AttachmentPreview
                                  key={a.id}
                                  name={a.name}
                                  type={a.type}
                                  size={a.size}
                                  previewUrl={a.previewUrl}
                                />
                              ))}
                            </div>
                          ) : null}
                          {m.content ? (
                            <div className='whitespace-pre-wrap rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground'>
                              {m.content}
                            </div>
                          ) : null}
                        </>
                      )}
                      {m.role === 'assistant' && m.stopped && (
                        <div className='mt-1 text-[11px] text-muted-foreground italic'>
                          ⏹ Stopped by you
                        </div>
                      )}
                      {/* Copy action — assistant messages, once they're done streaming. */}
                      {m.role === 'assistant' &&
                        m.content &&
                        !(isStreaming && i === messages.length - 1) && (
                          <div className='mt-1.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                            <button
                              type='button'
                              className='flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-background/60 hover:text-foreground'
                              onClick={() => {
                                navigator.clipboard.writeText(splitThinking(m.content).text)
                                setCopiedId(m.id)
                                setTimeout(() => setCopiedId((c) => (c === m.id ? null : c)), 1500)
                              }}
                            >
                              {copiedId === m.id ? (
                                <Check className='h-3 w-3' />
                              ) : (
                                <Copy className='h-3 w-3' />
                              )}
                              {copiedId === m.id ? 'Copied' : 'Copy'}
                            </button>
                            <button
                              type='button'
                              disabled={isStreaming}
                              className='flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-background/60 hover:text-foreground disabled:opacity-40'
                              onClick={() => retryAssistant(i)}
                            >
                              <RefreshCw className='h-3 w-3' />
                              Retry
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Queued messages (sent while a turn was streaming) — auto-dispatch when it finishes */}
        {queued.length > 0 && (
          <div className='mx-3 mb-1 flex flex-col gap-1'>
            {queued.map((q, i) => (
              <div
                key={`${i}-${q.text.slice(0, 12)}`}
                className='flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1 text-muted-foreground text-xs'
              >
                <span className='text-[10px] uppercase opacity-60'>Queued</span>
                <span className='flex-1 truncate'>{q.text}</span>
                <button
                  type='button'
                  className='opacity-60 hover:opacity-100'
                  onClick={() => setQueued((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label='Remove queued message'
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Composer — @-mentions + file attachments */}
        <ArenaComposer
          workspaceId={workspaceId}
          isStreaming={isStreaming}
          onSend={(displayText, apiText, attachments, contexts, displayAttachments) =>
            send(displayText, apiText, attachments, contexts, displayAttachments)
          }
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
