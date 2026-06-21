'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Download,
  FileText,
  Loader2,
  Network,
  PanelRightClose,
  PanelRightOpen,
  Play,
  ScrollText,
  Table as TableIcon,
  TerminalSquare,
  XCircle,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { WorkflowPreview } from '@/app/arena/[workspaceId]/zelaxy/components/workflow-preview/workflow-preview'

// The full table view, lazy-loaded only when a table resource is shown (it's heavy + client-only).
const InlineTable = dynamic(
  () => import('@/app/arena/[workspaceId]/tables/[tableId]/table').then((m) => m.Table),
  {
    ssr: false,
    loading: () => (
      <div className='flex h-full items-center justify-center'>
        <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
      </div>
    ),
  }
)

/**
 * The right-side "live session" panel for ZelaxyArena.
 *
 * Split vertically: the TOP shows the live workflow/resource the agent is building (a read-only
 * canvas via WorkflowPreview), and the BOTTOM shows the live Console (tool calls + results) and a
 * condensed Logs view. The divider between them is drag-resizable.
 */

export type ResourceKind = 'workflow' | 'table' | 'file'

export interface ResourceArtifact {
  id: string
  kind: ResourceKind
  title: string
  /** Workflow YAML (collapsed behind a toggle). */
  yaml?: string
  /** Full workflow state — renders the live canvas. */
  workflowState?: any
  /** Set once a workflow is persisted and openable in the editor. */
  workflowId?: string
  /** Download/preview URL for a file artifact. */
  url?: string
  subtitle?: string
}

export interface ConsoleEntry {
  id: string
  name: string
  status: 'running' | 'done' | 'error'
  args?: string
  result?: string
  error?: string
  /** Epoch ms when the tool started / finished — used for the Logs timeline + durations. */
  startedAt?: number
  endedAt?: number
}

const SPLIT_STORAGE_KEY = 'zelaxyarena.panel.bottomHeight'
const WIDTH_STORAGE_KEY = 'zelaxyarena.panel.width'
const MIN_PANEL_WIDTH = 340

function formatClock(ms?: number): string {
  if (!ms) return ''
  const d = new Date(ms)
  return d.toLocaleTimeString(undefined, { hour12: false })
}

function formatDuration(start?: number, end?: number): string {
  if (!start || !end || end < start) return ''
  const ms = end - start
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
}

function prettyToolName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function iconForKind(kind: ResourceKind) {
  if (kind === 'workflow') return Network
  if (kind === 'table') return TableIcon
  return FileText
}

const MIN_BOTTOM = 120
const MIN_TOP = 160

export function ArenaResourcePanel({
  workspaceId,
  artifacts,
  consoleEntries,
  isStreaming,
}: {
  workspaceId: string
  artifacts: ResourceArtifact[]
  consoleEntries: ConsoleEntry[]
  isStreaming: boolean
}) {
  const router = useRouter()

  // ── Top pane: active artifact (auto-follow the newest) ──────────────────────
  const [activeId, setActiveId] = useState<string | null>(null)
  const firstArtifactId = artifacts[0]?.id
  const prevFirstRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (firstArtifactId && firstArtifactId !== prevFirstRef.current) setActiveId(firstArtifactId)
    prevFirstRef.current = firstArtifactId
  }, [firstArtifactId])
  const effectiveActiveId =
    activeId && artifacts.some((a) => a.id === activeId) ? activeId : firstArtifactId
  const active = artifacts.find((a) => a.id === effectiveActiveId) ?? null

  // ── Bottom pane: Console vs Logs ────────────────────────────────────────────
  const [bottomTab, setBottomTab] = useState<'console' | 'logs'>('console')
  const [collapsed, setCollapsed] = useState(false)

  // ── Drag-resizable split (persisted) ─────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const [bottomHeight, setBottomHeight] = useState(260)
  useEffect(() => {
    const saved = Number(window.localStorage.getItem(SPLIT_STORAGE_KEY))
    if (saved && saved >= MIN_BOTTOM) setBottomHeight(saved)
  }, [])
  useEffect(() => {
    const t = setTimeout(
      () => window.localStorage.setItem(SPLIT_STORAGE_KEY, String(bottomHeight)),
      300
    )
    return () => clearTimeout(t)
  }, [bottomHeight])
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const fromBottom = rect.bottom - e.clientY
      setBottomHeight(Math.max(MIN_BOTTOM, Math.min(rect.height - MIN_TOP, fromBottom)))
    }
    const onUp = () => {
      draggingRef.current = false
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])
  const startDrag = useCallback(() => {
    draggingRef.current = true
    document.body.style.userSelect = 'none'
  }, [])

  // ── Horizontal resize: drag the panel's left edge to widen/narrow it (chat column flexes) ──────
  const hDraggingRef = useRef(false)
  const [panelWidth, setPanelWidth] = useState(640)
  useEffect(() => {
    const saved = Number(window.localStorage.getItem(WIDTH_STORAGE_KEY))
    if (saved && saved >= MIN_PANEL_WIDTH) setPanelWidth(saved)
  }, [])
  useEffect(() => {
    const t = setTimeout(
      () => window.localStorage.setItem(WIDTH_STORAGE_KEY, String(panelWidth)),
      300
    )
    return () => clearTimeout(t)
  }, [panelWidth])
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!hDraggingRef.current) return
      const w = window.innerWidth - e.clientX
      setPanelWidth(Math.max(MIN_PANEL_WIDTH, Math.min(window.innerWidth - 360, w)))
    }
    const onUp = () => {
      hDraggingRef.current = false
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])
  const startHResize = useCallback(() => {
    hDraggingRef.current = true
    document.body.style.userSelect = 'none'
  }, [])
  // Keep the panel from overflowing on smaller windows — clamp its width on mount + on resize.
  useEffect(() => {
    const clamp = () =>
      setPanelWidth((w) => Math.min(w, Math.max(MIN_PANEL_WIDTH, window.innerWidth - 360)))
    clamp()
    window.addEventListener('resize', clamp)
    return () => window.removeEventListener('resize', clamp)
  }, [])

  // ── Deploy & run a built workflow → real execution result streamed into Logs ──
  const [runEntries, setRunEntries] = useState<ConsoleEntry[]>([])
  const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(null)
  const runWorkflow = useCallback(
    async (artifact: ResourceArtifact) => {
      const wfId = artifact.workflowId
      if (!wfId || runningWorkflowId) return
      const entryId = `run:${wfId}:${Date.now()}`
      setRunningWorkflowId(wfId)
      setBottomTab('logs')
      setRunEntries((prev) => [
        ...prev,
        { id: entryId, name: `Run · ${artifact.title}`, status: 'running', startedAt: Date.now() },
      ])
      const finish = (patch: Partial<ConsoleEntry>) =>
        setRunEntries((prev) =>
          prev.map((e) => (e.id === entryId ? { ...e, endedAt: Date.now(), ...patch } : e))
        )
      try {
        // Deploy the current state, then execute the deployed workflow.
        const dep = await fetch(`/api/workflows/${wfId}/deploy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        })
        if (!dep.ok) {
          const d = await dep.json().catch(() => ({}))
          finish({
            status: 'error',
            error: d?.error || d?.message || `Deploy failed (HTTP ${dep.status})`,
          })
          return
        }
        const res = await fetch(`/api/workflows/${wfId}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data?.success !== false) {
          let preview = ''
          try {
            preview = JSON.stringify(data?.output ?? data ?? {}, null, 2).slice(0, 1500)
          } catch {
            preview = ''
          }
          finish({ status: 'done', result: preview })
        } else {
          finish({
            status: 'error',
            error: data?.error || data?.message || `Run failed (HTTP ${res.status})`,
          })
        }
      } catch (err) {
        finish({ status: 'error', error: err instanceof Error ? err.message : 'Run failed' })
      } finally {
        setRunningWorkflowId(null)
      }
    },
    [runningWorkflowId]
  )

  // Tool-call activity + run results, merged chronologically for the bottom panes.
  const events = useMemo(
    () =>
      [...consoleEntries, ...runEntries].sort((a, b) => (a.startedAt ?? 0) - (b.startedAt ?? 0)),
    [consoleEntries, runEntries]
  )
  const runningCount = events.filter((e) => e.status === 'running').length

  if (collapsed) {
    return (
      <div className='hidden w-10 flex-shrink-0 flex-col items-center gap-2 border-border/40 border-l bg-card/20 py-2 lg:flex'>
        <button
          type='button'
          onClick={() => setCollapsed(false)}
          title='Show live session'
          className='flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
        >
          <PanelRightOpen className='h-4 w-4' />
        </button>
        {isStreaming && <Loader2 className='h-3.5 w-3.5 animate-spin text-primary' />}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{ width: panelWidth }}
      className='relative hidden min-w-[340px] flex-shrink-0 flex-col bg-card/20 lg:flex'
    >
      {/* Left-edge horizontal resize handle (drag to widen/narrow the panel) */}
      <div
        role='separator'
        aria-orientation='vertical'
        onMouseDown={startHResize}
        className='group absolute top-0 bottom-0 left-0 z-20 flex w-1.5 cursor-col-resize items-center justify-center border-border/40 border-l hover:bg-muted'
      >
        <div className='h-8 w-0.5 rounded-full bg-border group-hover:bg-muted-foreground/50' />
      </div>

      {/* ── TOP: live workflow / resource preview ── */}
      <div className='flex min-h-0 flex-1 flex-col'>
        <div className='flex flex-shrink-0 items-center gap-2 border-border/40 border-b px-3 py-2'>
          <Network className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
          <span className='font-medium text-[13px] text-foreground'>Live session</span>
          {isStreaming && (
            <span className='ml-1 flex items-center gap-1 text-[11px] text-primary'>
              <Loader2 className='h-3 w-3 animate-spin' /> building
            </span>
          )}
          <div className='ml-auto flex items-center gap-1 overflow-x-auto'>
            {artifacts.map((a) => {
              const Icon = iconForKind(a.kind)
              const isActive = a.id === effectiveActiveId
              return (
                <button
                  key={a.id}
                  type='button'
                  onClick={() => setActiveId(a.id)}
                  title={a.title}
                  className={cn(
                    'flex max-w-[150px] flex-shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition-colors',
                    isActive
                      ? 'bg-background font-medium text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/60'
                  )}
                >
                  <Icon className='h-3 w-3 flex-shrink-0' />
                  <span className='truncate'>{a.title}</span>
                </button>
              )
            })}
          </div>
          <button
            type='button'
            onClick={() => setCollapsed(true)}
            title='Hide live session'
            className='ml-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          >
            <PanelRightClose className='h-4 w-4' />
          </button>
        </div>

        <div className='min-h-0 flex-1 overflow-hidden'>
          {!active ? (
            <EmptyLiveSession />
          ) : active.kind === 'workflow' ? (
            <WorkflowPane
              workspaceId={workspaceId}
              artifact={active}
              onOpen={router.push}
              onRun={runWorkflow}
              running={runningWorkflowId === active.workflowId}
            />
          ) : (
            <SimpleResourcePane artifact={active} workspaceId={workspaceId} onOpen={router.push} />
          )}
        </div>
      </div>

      {/* ── DRAG HANDLE ── */}
      <div
        role='separator'
        aria-orientation='horizontal'
        onMouseDown={startDrag}
        className='group flex h-2 flex-shrink-0 cursor-row-resize items-center justify-center border-border/40 border-t bg-background/40 hover:bg-muted'
      >
        <div className='h-0.5 w-8 rounded-full bg-border group-hover:bg-muted-foreground/50' />
      </div>

      {/* ── BOTTOM: console + logs ── */}
      <div
        style={{ height: bottomHeight }}
        className='flex flex-shrink-0 flex-col overflow-hidden bg-background/30'
      >
        <div className='flex flex-shrink-0 items-center gap-1 border-border/40 border-b px-2 py-1'>
          <BottomTab
            id='console'
            label='Console'
            icon={TerminalSquare}
            active={bottomTab === 'console'}
            badge={runningCount > 0 ? runningCount : undefined}
            onClick={() => setBottomTab('console')}
          />
          <BottomTab
            id='logs'
            label='Logs'
            icon={ScrollText}
            active={bottomTab === 'logs'}
            onClick={() => setBottomTab('logs')}
          />
          <span className='ml-auto pr-1 text-[10px] text-muted-foreground'>
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </span>
        </div>
        <div className='min-h-0 flex-1 overflow-hidden'>
          {bottomTab === 'console' ? (
            <ConsolePane entries={events} isStreaming={isStreaming} />
          ) : (
            <LogsPane entries={events} isStreaming={isStreaming} />
          )}
        </div>
      </div>
    </div>
  )
}

function BottomTab({
  label,
  icon: Icon,
  active,
  badge,
  onClick,
}: {
  id: string
  label: string
  icon: typeof Network
  active: boolean
  badge?: number
  onClick: () => void
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] transition-colors',
        active
          ? 'bg-background font-medium text-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted/60'
      )}
    >
      <Icon className='h-3.5 w-3.5' />
      <span>{label}</span>
      {badge !== undefined && (
        <span className='flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground'>
          {badge}
        </span>
      )}
    </button>
  )
}

function EmptyLiveSession() {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-2 px-6 text-center'>
      <Network className='h-9 w-9 text-muted-foreground/40' />
      <p className='font-medium text-foreground text-sm'>Live session</p>
      <p className='max-w-[260px] text-[12px] text-muted-foreground'>
        Workflows, tables and files ZelaxyArena builds appear here as a live, openable canvas.
      </p>
    </div>
  )
}

/**
 * Live console — one block per tool event, matching the main editor console panel's format:
 * header (status icon + name), a tag row (duration / time / Input·Output toggle), and a collapsible
 * JSON content box with copy + expand/collapse.
 */
function ConsolePane({ entries, isStreaming }: { entries: ConsoleEntry[]; isStreaming: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [entries])

  if (entries.length === 0) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-2 px-6 text-center'>
        <TerminalSquare className='h-7 w-7 text-muted-foreground/50' />
        <p className='text-[12px] text-muted-foreground'>
          Tool calls and results stream here as ZelaxyArena works.
        </p>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className='h-full divide-y divide-border/40 overflow-auto'>
      {entries.map((e) => (
        <div key={e.id} className='px-3 py-3'>
          <ArenaConsoleEntry entry={e} />
        </div>
      ))}
      {isStreaming && (
        <div className='flex items-center gap-2 px-3 py-2 text-[11px] text-muted-foreground'>
          <Loader2 className='h-3 w-3 animate-spin' /> working…
        </div>
      )}
    </div>
  )
}

/** A single console block — mirrors the editor's ConsoleEntry layout. */
function ArenaConsoleEntry({ entry }: { entry: ConsoleEntry }) {
  // Collapsed by default — the JSON shows as `{...}` and only expands when the user clicks.
  const [expanded, setExpanded] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [copied, setCopied] = useState(false)

  const durationMs =
    entry.startedAt && entry.endedAt && entry.endedAt >= entry.startedAt
      ? entry.endedAt - entry.startedAt
      : undefined
  const hasInput = Boolean(entry.args)
  const body = showInput ? entry.args : entry.error || entry.result
  const isErrorBody = !showInput && Boolean(entry.error)

  const copy = () => {
    if (!body) return
    navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const toggleTag = (selected: boolean) =>
    cn(
      'flex h-5 items-center rounded-md px-2 font-medium text-[11px] transition-colors',
      selected
        ? 'bg-primary/10 text-primary'
        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
    )

  return (
    <div className='space-y-2'>
      {/* Header */}
      <div className='flex items-center gap-2'>
        <StatusIcon status={entry.status} />
        <span className='font-medium text-foreground text-sm'>{prettyToolName(entry.name)}</span>
      </div>

      {/* Tag row: status/duration · time · Input/Output */}
      <div className='flex flex-wrap items-center gap-1.5'>
        <span
          className={cn(
            'flex h-5 items-center gap-1 rounded-md px-2 font-medium text-[11px]',
            entry.status === 'error'
              ? 'bg-destructive/10 text-destructive'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {entry.status === 'error' ? (
            <>
              <AlertCircle className='h-3 w-3' /> Error
            </>
          ) : entry.status === 'running' ? (
            'running…'
          ) : durationMs !== undefined ? (
            `${durationMs}ms`
          ) : (
            'done'
          )}
        </span>
        {entry.startedAt && (
          <span className='flex h-5 items-center rounded-md bg-muted px-2 font-medium text-[11px] text-muted-foreground'>
            {formatClock(entry.startedAt)}
          </span>
        )}
        {hasInput && (
          <>
            <button
              type='button'
              onClick={() => setShowInput(false)}
              className={toggleTag(!showInput)}
            >
              Output
            </button>
            <button
              type='button'
              onClick={() => setShowInput(true)}
              className={toggleTag(showInput)}
            >
              Input
            </button>
          </>
        )}
      </div>

      {/* Content box */}
      {body ? (
        <div className='rounded-lg border border-border/40 bg-muted/50 p-3'>
          <div className='relative'>
            <div className='absolute top-0 right-0 z-10 flex items-center gap-1'>
              <button
                type='button'
                onClick={copy}
                className='text-muted-foreground hover:text-foreground'
                title='Copy'
              >
                {copied ? <Check className='h-3 w-3' /> : <Clipboard className='h-3 w-3' />}
              </button>
              <button
                type='button'
                onClick={() => setExpanded((v) => !v)}
                className='text-muted-foreground hover:text-foreground'
                title={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? <ChevronUp className='h-3 w-3' /> : <ChevronDown className='h-3 w-3' />}
              </button>
            </div>
            {expanded ? (
              <pre
                className={cn(
                  'max-w-full overflow-x-auto whitespace-pre-wrap break-words pr-12 font-mono text-[11px] leading-relaxed',
                  isErrorBody ? 'text-destructive' : 'text-foreground/80'
                )}
              >
                {body}
              </pre>
            ) : (
              <button
                type='button'
                onClick={() => setExpanded(true)}
                className='font-mono text-[11px] text-foreground/60'
              >
                {'{...}'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className='rounded-lg border border-border/40 bg-muted/50 p-3 text-center font-normal text-[12px] text-muted-foreground'>
          {entry.status === 'running' ? 'Running…' : 'No output'}
        </div>
      )}
    </div>
  )
}

/** Condensed activity log — one line per tool event (status · name · brief). */
function LogsPane({ entries, isStreaming }: { entries: ConsoleEntry[]; isStreaming: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [entries])

  if (entries.length === 0) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-2 px-6 text-center'>
        <ScrollText className='h-7 w-7 text-muted-foreground/50' />
        <p className='text-[12px] text-muted-foreground'>The full activity log appears here.</p>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className='h-full overflow-auto p-2 font-mono text-[11px] leading-relaxed'>
      {entries.map((e) => (
        <LogEntry key={e.id} entry={e} />
      ))}
      {isStreaming && (
        <div className='flex items-center gap-2 px-1.5 py-1 text-muted-foreground'>
          <Loader2 className='h-3 w-3 animate-spin' /> working…
        </div>
      )}
    </div>
  )
}

/** One log line — header always visible; the FULL input/output is collapsed until the user opens it. */
function LogEntry({ entry: e }: { entry: ConsoleEntry }) {
  const [open, setOpen] = useState(false)
  const dur = formatDuration(e.startedAt, e.endedAt)
  const sections: Array<{ label: string; text: string; error?: boolean }> = []
  if (e.args) sections.push({ label: 'input', text: e.args })
  if (e.error) sections.push({ label: 'error', text: e.error, error: true })
  else if (e.result) sections.push({ label: 'output', text: e.result })
  const hasBody = sections.length > 0

  return (
    <div className='border-border/30 border-b py-1.5'>
      <button
        type='button'
        onClick={() => hasBody && setOpen((v) => !v)}
        className={cn(
          'flex w-full flex-wrap items-center gap-2 text-left',
          hasBody ? 'cursor-pointer' : 'cursor-default'
        )}
      >
        <span className='flex-shrink-0 text-[10px] text-muted-foreground/60 tabular-nums'>
          {formatClock(e.startedAt)}
        </span>
        <StatusIcon status={e.status} />
        <span className='font-medium text-foreground'>{prettyToolName(e.name)}</span>
        {dur && (
          <span className='rounded bg-muted/60 px-1 text-[10px] text-muted-foreground/80'>
            {dur}
          </span>
        )}
        {hasBody && (
          <span className='ml-auto flex-shrink-0 text-muted-foreground/60'>
            {open ? <ChevronUp className='h-3 w-3' /> : <ChevronDown className='h-3 w-3' />}
          </span>
        )}
      </button>
      {open &&
        sections.map((s) => (
          <pre
            key={`${e.id}-${s.label}`}
            className={cn(
              'mt-1 max-w-full overflow-x-auto whitespace-pre-wrap break-words pl-1',
              s.error ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            <span className='text-muted-foreground/50'>{s.label}: </span>
            {s.text}
          </pre>
        ))}
    </div>
  )
}

function StatusIcon({ status }: { status: ConsoleEntry['status'] }) {
  if (status === 'running') return <Loader2 className='h-3.5 w-3.5 animate-spin text-primary' />
  if (status === 'error') return <XCircle className='h-3.5 w-3.5 flex-shrink-0 text-destructive' />
  return <CheckCircle2 className='h-3.5 w-3.5 flex-shrink-0 text-emerald-500' />
}

/** Workflow preview — live read-only canvas + deploy & run + open-in-editor + collapsible YAML. */
function WorkflowPane({
  workspaceId,
  artifact,
  onOpen,
  onRun,
  running,
}: {
  workspaceId: string
  artifact: ResourceArtifact
  onOpen: (href: string) => void
  onRun: (artifact: ResourceArtifact) => void
  running: boolean
}) {
  return (
    <div className='flex h-full flex-col'>
      <div className='flex flex-shrink-0 items-center justify-between gap-2 border-border/40 border-b px-3 py-2'>
        <div className='flex min-w-0 items-center gap-2'>
          <Network className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
          <h2 className='truncate font-medium text-sm'>{artifact.title}</h2>
        </div>
        {artifact.workflowId ? (
          <div className='flex flex-shrink-0 items-center gap-1.5'>
            <Button
              size='sm'
              variant='outline'
              className='h-7'
              disabled={running}
              onClick={() => onRun(artifact)}
              title='Deploy the current workflow and run it'
            >
              {running ? (
                <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
              ) : (
                <Play className='mr-1.5 h-3.5 w-3.5' />
              )}
              {running ? 'Running…' : 'Deploy & run'}
            </Button>
            <Button
              size='sm'
              className='h-7'
              onClick={() => onOpen(`/arena/${workspaceId}/zelaxy/${artifact.workflowId}`)}
            >
              Open in editor
            </Button>
          </div>
        ) : (
          <span className='flex-shrink-0 text-[11px] text-amber-600 dark:text-amber-400'>
            Saving…
          </span>
        )}
      </div>

      <div className='relative min-h-0 flex-1'>
        {artifact.workflowState ? (
          <WorkflowPreview
            workflowState={artifact.workflowState}
            isPannable
            height='100%'
            width='100%'
          />
        ) : (
          <div className='flex h-full items-center justify-center'>
            <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
          </div>
        )}
      </div>

      {artifact.yaml && (
        <details className='flex-shrink-0 border-border/40 border-t px-3 py-2'>
          <summary className='cursor-pointer text-[11px] text-muted-foreground hover:text-foreground'>
            View YAML
          </summary>
          <pre className='mt-2 max-h-48 overflow-auto rounded-lg border border-border/50 bg-background/60 p-2.5 text-[11px] text-muted-foreground'>
            {artifact.yaml}
          </pre>
        </details>
      )}
    </div>
  )
}

/**
 * Table → the full table view embedded inline (live, editable). File → a card with a download
 * action. Both keep an "Open full page" affordance.
 */
function SimpleResourcePane({
  artifact,
  workspaceId,
  onOpen,
}: {
  artifact: ResourceArtifact
  workspaceId: string
  onOpen: (href: string) => void
}) {
  if (artifact.kind === 'table') {
    const tableId = artifact.id.replace(/^table:/, '')
    return (
      <div className='flex h-full flex-col'>
        <div className='flex flex-shrink-0 items-center justify-end border-border/40 border-b px-3 py-1.5'>
          <Button
            size='sm'
            variant='ghost'
            className='h-6 text-[11px]'
            onClick={() => onOpen(`/arena/${workspaceId}/tables/${tableId}`)}
          >
            Open full page
          </Button>
        </div>
        <div className='relative min-h-0 flex-1 overflow-auto'>
          <InlineTable tableId={tableId} workspaceId={workspaceId} />
        </div>
      </div>
    )
  }

  const Icon = iconForKind(artifact.kind)
  return (
    <div className='p-4'>
      <div className='space-y-2 rounded-xl border border-border/60 bg-background/40 p-3'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex min-w-0 items-center gap-2'>
            <Icon className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
            <div className='min-w-0'>
              <h2 className='truncate font-medium text-sm'>{artifact.title}</h2>
              {artifact.subtitle && (
                <p className='truncate text-[11px] text-muted-foreground'>{artifact.subtitle}</p>
              )}
            </div>
          </div>
          {artifact.url ? (
            <a href={artifact.url} target='_blank' rel='noopener noreferrer'>
              <Button size='sm' variant='outline' className='h-7 flex-shrink-0'>
                <Download className='mr-1.5 h-3.5 w-3.5' />
                Download
              </Button>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}
