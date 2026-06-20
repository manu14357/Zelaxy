'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Network,
  Table as TableIcon,
  TerminalSquare,
  XCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { WorkflowPreview } from '@/app/arena/[workspaceId]/zelaxy/components/workflow-preview/workflow-preview'

/**
 * The right-side "live session" panel for ZelaxyArena. A tabbed resource panel: the workflow tab
 * embeds a live read-only canvas (WorkflowPreview) and a Console tab streams tool-call entries live.
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
}

function prettyToolName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function iconForKind(kind: ResourceKind) {
  if (kind === 'workflow') return Network
  if (kind === 'table') return TableIcon
  return FileText
}

interface Tab {
  id: string
  label: string
  icon: typeof Network
}

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

  const tabs = useMemo<Tab[]>(() => {
    const list: Tab[] = artifacts.map((a) => ({
      id: a.id,
      label: a.title,
      icon: iconForKind(a.kind),
    }))
    // The Console tab is always present so live tool output is reachable even before any artifact.
    list.push({ id: 'console', label: 'Console', icon: TerminalSquare })
    return list
  }, [artifacts])

  // Auto-activate the newest artifact whenever one appears or its id changes (e.g. a draft workflow
  // upgrading to a persisted one), so the latest result is shown automatically.
  const [activeId, setActiveId] = useState<string | null>(null)
  const firstArtifactId = artifacts[0]?.id
  const prevFirstRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (firstArtifactId && firstArtifactId !== prevFirstRef.current) setActiveId(firstArtifactId)
    prevFirstRef.current = firstArtifactId
  }, [firstArtifactId])

  const effectiveActive =
    activeId && tabs.some((t) => t.id === activeId) ? activeId : (firstArtifactId ?? 'console')

  const active = artifacts.find((a) => a.id === effectiveActive) ?? null

  return (
    <div className='hidden w-[42%] min-w-[320px] max-w-[680px] flex-col bg-card/20 lg:flex'>
      {/* Tab bar */}
      <div className='flex flex-shrink-0 items-center gap-1 overflow-x-auto border-border/40 border-b px-2 py-1.5'>
        {tabs.map((t) => {
          const Icon = t.icon
          const isActive = t.id === effectiveActive
          return (
            <button
              key={t.id}
              type='button'
              onClick={() => setActiveId(t.id)}
              className={cn(
                'flex max-w-[180px] flex-shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] transition-colors',
                isActive
                  ? 'bg-background font-medium text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/60'
              )}
              title={t.label}
            >
              <Icon className='h-3.5 w-3.5 flex-shrink-0' />
              <span className='truncate'>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className='min-h-0 flex-1 overflow-hidden'>
        {effectiveActive === 'console' || !active ? (
          <ConsolePane entries={consoleEntries} isStreaming={isStreaming} />
        ) : active.kind === 'workflow' ? (
          <WorkflowPane workspaceId={workspaceId} artifact={active} onOpen={router.push} />
        ) : (
          <SimpleResourcePane artifact={active} workspaceId={workspaceId} onOpen={router.push} />
        )}
      </div>
    </div>
  )
}

/** Live console — streams tool-call entries with status, args and results. */
function ConsolePane({ entries, isStreaming }: { entries: ConsoleEntry[]; isStreaming: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [entries])

  if (entries.length === 0) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-2 text-center'>
        <TerminalSquare className='h-8 w-8 text-muted-foreground/50' />
        <p className='text-muted-foreground text-sm'>
          Tool calls and results stream here as ZelaxyArena works.
        </p>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className='h-full space-y-2 overflow-auto p-3 font-mono text-[12px]'>
      {entries.map((e) => (
        <div key={e.id} className='rounded-lg border border-border/50 bg-background/50 p-2.5'>
          <div className='flex items-center gap-2'>
            {e.status === 'running' ? (
              <Loader2 className='h-3.5 w-3.5 animate-spin text-primary' />
            ) : e.status === 'error' ? (
              <XCircle className='h-3.5 w-3.5 text-destructive' />
            ) : (
              <CheckCircle2 className='h-3.5 w-3.5 text-emerald-500' />
            )}
            <span className='font-medium text-foreground'>{prettyToolName(e.name)}</span>
          </div>
          {e.args && (
            <pre className='mt-1.5 max-h-32 overflow-auto whitespace-pre-wrap break-words text-[11px] text-muted-foreground'>
              {e.args}
            </pre>
          )}
          {e.error ? (
            <pre className='mt-1.5 max-h-32 overflow-auto whitespace-pre-wrap break-words text-[11px] text-destructive'>
              {e.error}
            </pre>
          ) : (
            e.result && (
              <pre className='mt-1.5 max-h-40 overflow-auto whitespace-pre-wrap break-words text-[11px] text-muted-foreground'>
                {e.result}
              </pre>
            )
          )}
        </div>
      ))}
      {isStreaming && (
        <div className='flex items-center gap-2 px-1 py-1 text-[11px] text-muted-foreground'>
          <Loader2 className='h-3 w-3 animate-spin' /> working…
        </div>
      )}
    </div>
  )
}

/** Workflow tab — live read-only canvas + open-in-editor + collapsible YAML. */
function WorkflowPane({
  workspaceId,
  artifact,
  onOpen,
}: {
  workspaceId: string
  artifact: ResourceArtifact
  onOpen: (href: string) => void
}) {
  return (
    <div className='flex h-full flex-col'>
      <div className='flex flex-shrink-0 items-center justify-between gap-2 border-border/40 border-b px-3 py-2'>
        <div className='flex min-w-0 items-center gap-2'>
          <Network className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
          <h2 className='truncate font-medium text-sm'>{artifact.title}</h2>
        </div>
        {artifact.workflowId ? (
          <Button
            size='sm'
            className='h-7 flex-shrink-0'
            onClick={() => onOpen(`/arena/${workspaceId}/zelaxy/${artifact.workflowId}`)}
          >
            Open in editor
          </Button>
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

/** Table / file tab — card with the matching open/download action. */
function SimpleResourcePane({
  artifact,
  workspaceId,
  onOpen,
}: {
  artifact: ResourceArtifact
  workspaceId: string
  onOpen: (href: string) => void
}) {
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
          {artifact.kind === 'table' ? (
            <Button
              size='sm'
              variant='outline'
              className='h-7 flex-shrink-0'
              onClick={() => onOpen(`/arena/${workspaceId}/hub?tab=tables`)}
            >
              Open
            </Button>
          ) : artifact.url ? (
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
