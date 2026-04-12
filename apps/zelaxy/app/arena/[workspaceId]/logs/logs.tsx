/**
 * Workflow Logs — Clean table-style UI
 *
 * Pure Tailwind classes, no inline styles, production-safe.
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  Globe,
  Loader2,
  MessageSquare,
  Play,
  Radio,
  RefreshCw,
  Search,
  Timer,
  X,
  Zap,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'
import { Filters } from '@/app/arena/[workspaceId]/logs/components/filters/filters'
import { Sidebar } from '@/app/arena/[workspaceId]/logs/components/sidebar/sidebar'
import { formatDate } from '@/app/arena/[workspaceId]/logs/utils/format-date'
import { useSocket } from '@/contexts/socket-context'
import { useDebounce } from '@/hooks/use-debounce'
import { useFilterStore } from '@/stores/logs/filters/store'
import type { LogsResponse, WorkflowLog } from '@/stores/logs/filters/types'
import './logs.css'

const logger = createLogger('Logs')
const LOGS_PER_PAGE = 50

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDurationMs(duration: string | null): number {
  if (!duration) return 0
  const match = duration.match(/([\d.]+)\s*(ms|s|m|h)/i)
  if (!match) {
    const num = Number.parseFloat(duration)
    return Number.isNaN(num) ? 0 : num
  }
  const val = Number.parseFloat(match[1])
  switch (match[2].toLowerCase()) {
    case 'ms':
      return val
    case 's':
      return val * 1000
    case 'm':
      return val * 60000
    case 'h':
      return val * 3600000
    default:
      return val
  }
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

function getTimeGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 5) return 'Just now'
  if (diffMins < 60) return 'Last hour'

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return 'Today'

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return 'This week'
  if (diffDays < 30) return 'This month'
  return 'Older'
}

// ─── Trigger helpers ─────────────────────────────────────────────────────────

const TriggerIcon = ({
  trigger,
  className,
}: {
  trigger: string | null | undefined
  className?: string
}) => {
  const cls = cn('h-3.5 w-3.5', className)
  switch (trigger?.toLowerCase()) {
    case 'chat':
      return <MessageSquare className={cls} />
    case 'api':
      return <Globe className={cls} />
    case 'webhook':
      return <Zap className={cls} />
    case 'schedule':
      return <Timer className={cls} />
    case 'manual':
      return <Play className={cls} />
    default:
      return <Bot className={cls} />
  }
}

function triggerColor(trigger: string | null | undefined) {
  switch (trigger?.toLowerCase()) {
    case 'chat':
      return 'text-orange-500 bg-orange-500/10 border-orange-500/20'
    case 'api':
      return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    case 'webhook':
      return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    case 'schedule':
      return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    case 'manual':
      return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
    default:
      return 'text-muted-foreground bg-muted/50 border-border/50'
  }
}

// Workflow color mapped to safe Tailwind token classes
function workflowBadgeClasses(color: string | undefined) {
  if (!color) return 'border-border/40 bg-muted/40 text-muted-foreground'
  // Map common hex prefixes to tailwind palette colors
  const c = color.toLowerCase()
  if (c.startsWith('#ef') || c.startsWith('#f87') || c.startsWith('#dc') || c.startsWith('#e11'))
    return 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
  if (c.startsWith('#f97') || c.startsWith('#fb9') || c.startsWith('#f59'))
    return 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400'
  if (c.startsWith('#eab') || c.startsWith('#fbb') || c.startsWith('#f59'))
    return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
  if (c.startsWith('#84c') || c.startsWith('#22c') || c.startsWith('#10b') || c.startsWith('#4ad'))
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
  if (c.startsWith('#38b') || c.startsWith('#3b8') || c.startsWith('#60a') || c.startsWith('#818'))
    return 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
  if (c.startsWith('#a78') || c.startsWith('#8b5') || c.startsWith('#7c3'))
    return 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
  if (c.startsWith('#e87') || c.startsWith('#ec4') || c.startsWith('#f43'))
    return 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
  // Fallback — use primary accent
  return 'border-primary/30 bg-primary/10 text-primary'
}

// Duration bar width class (stepped to avoid inline %)
function durationWidthClass(ms: number, maxMs: number): string {
  if (!ms || !maxMs) return 'w-0'
  const pct = Math.min((ms / maxMs) * 100, 100)
  if (pct >= 90) return 'w-[95%]'
  if (pct >= 75) return 'w-3/4'
  if (pct >= 60) return 'w-3/5'
  if (pct >= 45) return 'w-[45%]'
  if (pct >= 30) return 'w-[30%]'
  if (pct >= 15) return 'w-[15%]'
  return 'w-[8%]'
}

// ─── Stats ───────────────────────────────────────────────────────────────────

function StatsSummary({ logs }: { logs: WorkflowLog[] }) {
  const stats = useMemo(() => {
    const total = logs.length
    const errors = logs.filter((l) => l.level === 'error').length
    const successRate = total > 0 ? Math.round(((total - errors) / total) * 100) : 0
    const durations = logs.map((l) => parseDurationMs(l.duration)).filter((d) => d > 0)
    const avgDuration =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
    const triggerCounts: Record<string, number> = {}
    for (const l of logs) {
      const t = l.trigger?.toLowerCase() || 'unknown'
      triggerCounts[t] = (triggerCounts[t] || 0) + 1
    }
    const topTrigger = Object.entries(triggerCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || '—'
    return { total, errors, successRate, avgDuration, topTrigger }
  }, [logs])

  const rateColor =
    stats.successRate >= 90
      ? 'text-emerald-500'
      : stats.successRate >= 70
        ? 'text-amber-500'
        : 'text-red-500'

  const rateBg =
    stats.successRate >= 90
      ? 'bg-emerald-500/10'
      : stats.successRate >= 70
        ? 'bg-amber-500/10'
        : 'bg-red-500/10'

  const rateBarBg =
    stats.successRate >= 90
      ? 'bg-emerald-500/60'
      : stats.successRate >= 70
        ? 'bg-amber-500/60'
        : 'bg-red-500/60'

  const rateBarWidth =
    stats.successRate >= 90
      ? 'w-[90%]'
      : stats.successRate >= 80
        ? 'w-4/5'
        : stats.successRate >= 70
          ? 'w-[70%]'
          : stats.successRate >= 50
            ? 'w-1/2'
            : stats.successRate >= 30
              ? 'w-[30%]'
              : 'w-[15%]'

  return (
    <div className='grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5'>
      {/* Total */}
      <div className='rounded-xl border border-border/40 bg-card/60 p-3'>
        <div className='flex items-center gap-2.5'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
            <Zap className='h-4 w-4 text-primary' />
          </div>
          <div>
            <div className='font-semibold text-lg text-foreground tabular-nums leading-none'>
              {stats.total}
            </div>
            <div className='mt-0.5 text-[10px] text-muted-foreground uppercase tracking-wider'>
              Executions
            </div>
          </div>
        </div>
      </div>

      {/* Success Rate */}
      <div className='rounded-xl border border-border/40 bg-card/60 p-3'>
        <div className='flex items-center gap-2.5'>
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', rateBg)}>
            <Radio className={cn('h-4 w-4', rateColor)} />
          </div>
          <div>
            <div className='font-semibold text-lg text-foreground tabular-nums leading-none'>
              {stats.successRate}%
            </div>
            <div className='mt-0.5 text-[10px] text-muted-foreground uppercase tracking-wider'>
              Success
            </div>
          </div>
        </div>
        <div className='mt-2.5 h-1 w-full overflow-hidden rounded-full bg-muted/40'>
          <div className={cn('h-full rounded-full transition-all duration-700', rateBarBg, rateBarWidth)} />
        </div>
      </div>

      {/* Errors */}
      <div className='rounded-xl border border-border/40 bg-card/60 p-3'>
        <div className='flex items-center gap-2.5'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10'>
            <AlertCircle className='h-4 w-4 text-red-500' />
          </div>
          <div>
            <div className='font-semibold text-lg text-foreground tabular-nums leading-none'>
              {stats.errors}
            </div>
            <div className='mt-0.5 text-[10px] text-muted-foreground uppercase tracking-wider'>
              Errors
            </div>
          </div>
        </div>
      </div>

      {/* Avg Duration */}
      <div className='rounded-xl border border-border/40 bg-card/60 p-3'>
        <div className='flex items-center gap-2.5'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10'>
            <Clock className='h-4 w-4 text-blue-500' />
          </div>
          <div>
            <div className='font-semibold text-lg text-foreground tabular-nums leading-none'>
              {formatMs(stats.avgDuration)}
            </div>
            <div className='mt-0.5 text-[10px] text-muted-foreground uppercase tracking-wider'>
              Avg Time
            </div>
          </div>
        </div>
      </div>

      {/* Top Trigger */}
      <div className='col-span-2 hidden rounded-xl border border-border/40 bg-card/60 p-3 sm:col-span-1 lg:block'>
        <div className='flex items-center gap-2.5'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10'>
            <TriggerIcon trigger={stats.topTrigger} className='text-violet-500' />
          </div>
          <div>
            <div className='font-semibold text-sm text-foreground capitalize leading-none'>
              {stats.topTrigger}
            </div>
            <div className='mt-0.5 text-[10px] text-muted-foreground uppercase tracking-wider'>
              Top Trigger
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Log Row ─────────────────────────────────────────────────────────────────

interface LogRowProps {
  log: WorkflowLog
  isSelected: boolean
  maxDuration: number
  onClick: () => void
}

function LogRow({ log, isSelected, maxDuration, onClick }: LogRowProps) {
  const formattedDate = formatDate(log.createdAt)
  const isError = log.level === 'error'
  const isRunning = log.message === 'Running...'
  const blockCount =
    (log.metadata as any)?.blockStats?.total || (log.metadata as any)?.traceSpans?.length || 0
  const ms = parseDurationMs(log.duration)
  const barWidthCls = durationWidthClass(ms, maxDuration)

  return (
    <div
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-lg border transition-colors duration-150',
        isSelected
          ? 'border-primary/30 bg-primary/[0.05]'
          : 'border-border/40 bg-card/40 hover:border-border/60 hover:bg-card/70',
        isError && !isSelected && 'border-red-500/20 hover:border-red-500/30',
        isRunning && !isSelected && 'border-blue-500/20'
      )}
      onClick={onClick}
    >
      {isSelected && (
        <div className='absolute inset-y-0 left-0 w-[3px] bg-primary' />
      )}

      <div className='flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4'>
        {/* Trigger icon */}
        <div
          className={cn(
            'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border',
            triggerColor(log.trigger)
          )}
        >
          {isRunning ? (
            <Loader2 className='h-3.5 w-3.5 animate-spin' />
          ) : (
            <TriggerIcon trigger={log.trigger} />
          )}
        </div>

        {/* Workflow badge */}
        {log.workflow && (
          <span
            className={cn(
              'inline-flex flex-shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 font-medium text-[11px]',
              workflowBadgeClasses(log.workflow.color)
            )}
          >
            <span className='h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current opacity-70' />
            <span className='max-w-[80px] truncate sm:max-w-[140px]'>{log.workflow.name}</span>
          </span>
        )}

        {/* Message — desktop */}
        <span className='hidden min-w-0 flex-1 truncate text-xs text-muted-foreground sm:block'>
          {log.message}
        </span>

        {/* Mobile spacer */}
        <div className='flex-1 sm:hidden' />

        {/* Status badge */}
        {isError && (
          <span className='inline-flex flex-shrink-0 items-center gap-1 rounded-md bg-red-500/10 px-1.5 py-0.5 font-medium text-[10px] text-red-500'>
            <AlertCircle className='h-2.5 w-2.5' />
            <span className='hidden sm:inline'>Error</span>
          </span>
        )}
        {!isError && !isRunning && (
          <span className='inline-flex flex-shrink-0 items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-medium text-[10px] text-emerald-600 dark:text-emerald-400'>
            <CheckCircle2 className='h-2.5 w-2.5' />
            <span className='hidden sm:inline'>Completed</span>
          </span>
        )}
        {isRunning && (
          <span className='inline-flex flex-shrink-0 items-center gap-1 rounded-md bg-blue-500/10 px-1.5 py-0.5 font-medium text-[10px] text-blue-500'>
            <Loader2 className='h-2.5 w-2.5 animate-spin' />
            <span className='hidden sm:inline'>Running</span>
          </span>
        )}

        {/* Desktop metadata */}
        <div className='hidden flex-shrink-0 items-center gap-2 text-[11px] text-muted-foreground/70 sm:flex'>
          {blockCount > 0 && (
            <>
              <span className='text-border'>·</span>
              <span className='tabular-nums'>
                {blockCount} block{blockCount !== 1 ? 's' : ''}
              </span>
            </>
          )}
          {log.duration && (
            <>
              <span className='text-border'>·</span>
              <span className='font-medium text-foreground/60 tabular-nums'>{log.duration}</span>
            </>
          )}
          <span className='text-border'>·</span>
          <span className='tabular-nums'>{formattedDate.relative}</span>
          <span className='text-border'>·</span>
          <span className='font-medium tabular-nums'>{formattedDate.compactTime}</span>
          <span className='font-mono text-[10px] text-muted-foreground/40'>
            #{log.id.slice(-4)}
          </span>
          <ArrowRight
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground/20 transition-opacity duration-150',
              'opacity-0 group-hover:opacity-100',
              isSelected && 'text-primary/50 opacity-100'
            )}
          />
        </div>
      </div>

      {/* Mobile row 2 */}
      <div className='flex items-center gap-1.5 px-3 pb-2 pl-12 sm:hidden'>
        <span className='min-w-0 flex-1 truncate text-[11px] text-muted-foreground'>
          {log.message}
        </span>
        <div className='flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground/70'>
          {blockCount > 0 && <span className='tabular-nums'>{blockCount} blk</span>}
          {log.duration && (
            <>
              {blockCount > 0 && <span className='text-border'>·</span>}
              <span className='font-medium text-foreground/60 tabular-nums'>{log.duration}</span>
            </>
          )}
          <span className='text-border'>·</span>
          <span className='font-medium tabular-nums'>{formattedDate.compactTime}</span>
        </div>
      </div>

      {/* Duration bar */}
      <div className='h-[2px] w-full bg-muted/20'>
        {isRunning ? (
          <div className='logs-running-bar h-full w-full' />
        ) : ms > 0 ? (
          <div
            className={cn(
              'h-full rounded-r-full transition-all duration-500',
              isError ? 'bg-red-500/50' : ms > 30000 ? 'bg-amber-500/50' : 'bg-emerald-500/50',
              barWidthCls
            )}
          />
        ) : null}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function Logs() {
  const params = useParams()
  const workspaceId = params.workspaceId as string

  const {
    logs,
    loading,
    error,
    setLogs,
    setLoading,
    setError,
    setWorkspaceId,
    page,
    setPage,
    hasMore,
    setHasMore,
    isFetchingMore,
    setIsFetchingMore,
    initializeFromURL,
    timeRange,
    level,
    workflowIds,
    folderIds,
    searchQuery: storeSearchQuery,
    setSearchQuery: setStoreSearchQuery,
    triggers,
  } = useFilterStore()

  useEffect(() => {
    setWorkspaceId(workspaceId)
  }, [workspaceId])

  const [selectedLog, setSelectedLog] = useState<WorkflowLog | null>(null)
  const [selectedLogIndex, setSelectedLogIndex] = useState<number>(-1)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const selectedRowRef = useRef<HTMLDivElement | null>(null)
  const loaderRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isInitialized = useRef<boolean>(false)

  const [searchQuery, setSearchQuery] = useState(storeSearchQuery)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const [isLive, setIsLive] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const maxDuration = useMemo(
    () => Math.max(...logs.map((l) => parseDurationMs(l.duration)), 1),
    [logs]
  )

  const groupedLogs = useMemo(() => {
    const groups: { label: string; logs: WorkflowLog[] }[] = []
    let currentGroup = ''
    for (const log of logs) {
      const group = getTimeGroup(log.createdAt)
      if (group !== currentGroup) {
        groups.push({ label: group, logs: [log] })
        currentGroup = group
      } else {
        groups[groups.length - 1].logs.push(log)
      }
    }
    return groups
  }, [logs])

  useEffect(() => {
    setSearchQuery(storeSearchQuery)
  }, [storeSearchQuery])

  useEffect(() => {
    if (isInitialized.current && debouncedSearchQuery !== storeSearchQuery) {
      setStoreSearchQuery(debouncedSearchQuery)
    }
  }, [debouncedSearchQuery, storeSearchQuery])

  // ─── Selection & navigation ────────────────────────────────────────────────

  const handleLogClick = (log: WorkflowLog) => {
    setSelectedLog(log)
    const index = logs.findIndex((l) => l.id === log.id)
    setSelectedLogIndex(index)
    setIsSidebarOpen(true)
  }

  const handleNavigateNext = useCallback(() => {
    if (selectedLogIndex < logs.length - 1) {
      const nextIndex = selectedLogIndex + 1
      setSelectedLogIndex(nextIndex)
      setSelectedLog(logs[nextIndex])
    }
  }, [selectedLogIndex, logs])

  const handleNavigatePrev = useCallback(() => {
    if (selectedLogIndex > 0) {
      const prevIndex = selectedLogIndex - 1
      setSelectedLogIndex(prevIndex)
      setSelectedLog(logs[prevIndex])
    }
  }, [selectedLogIndex, logs])

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false)
    setSelectedLog(null)
    setSelectedLogIndex(-1)
  }

  useEffect(() => {
    if (selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedLogIndex])

  // ─── Data fetching ─────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async (pageNum: number, append = false) => {
    try {
      if (pageNum > 1) setIsFetchingMore(true)

      const { buildQueryParams: getCurrentQueryParams } = useFilterStore.getState()
      const queryParams = getCurrentQueryParams(pageNum, LOGS_PER_PAGE)
      const response = await fetch(`/api/logs?${queryParams}`)

      if (!response.ok) throw new Error(`Error fetching logs: ${response.statusText}`)

      const data: LogsResponse = await response.json()
      setHasMore(data.data.length === LOGS_PER_PAGE && data.page < data.totalPages)
      setLogs(data.data, append)
      setError(null)
    } catch (err) {
      logger.error('Failed to fetch logs:', { err })
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      if (pageNum > 1) setIsFetchingMore(false)
    }
  }, [])

  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    try {
      await fetchLogs(1)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsRefreshing(false)
    }
  }

  // ─── Live mode ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current)
      liveIntervalRef.current = null
    }
    if (isLive) {
      handleRefresh()
      liveIntervalRef.current = setInterval(() => {
        handleRefresh()
      }, 5000)
    }
    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current)
        liveIntervalRef.current = null
      }
    }
  }, [isLive])

  // ─── Socket.IO realtime ────────────────────────────────────────────────────

  const {
    isConnected: socketConnected,
    joinWorkspace,
    leaveWorkspace,
    onExecutionStarted,
    onExecutionBlockComplete,
    onExecutionComplete,
  } = useSocket()

  useEffect(() => {
    if (socketConnected && workspaceId) joinWorkspace(workspaceId)
    return () => {
      leaveWorkspace()
    }
  }, [socketConnected, workspaceId, joinWorkspace, leaveWorkspace])

  useEffect(() => {
    onExecutionStarted((data: { workflowId: string; executionId: string }) => {
      logger.info('Real-time: execution started', data.executionId)
      const inProgressLog: WorkflowLog = {
        id: `live-${data.executionId}`,
        workflowId: data.workflowId,
        executionId: data.executionId,
        level: 'info',
        message: 'Running...',
        duration: null,
        trigger: null,
        createdAt: new Date().toISOString(),
        metadata: { traceSpans: [] },
      }
      useFilterStore.setState((state) => ({ logs: [inProgressLog, ...state.logs] }))
    })
  }, [onExecutionStarted])

  useEffect(() => {
    onExecutionBlockComplete((data: { executionId: string; traceSpan?: any }) => {
      if (!data.traceSpan) return
      useFilterStore.setState((state) => ({
        logs: state.logs.map((log) => {
          if (log.executionId === data.executionId) {
            const existingSpans = log.metadata?.traceSpans || []
            return {
              ...log,
              metadata: { ...log.metadata, traceSpans: [...existingSpans, data.traceSpan] },
            }
          }
          return log
        }),
      }))
    })
  }, [onExecutionBlockComplete])

  useEffect(() => {
    onExecutionComplete((_data: { executionId: string; success: boolean }) => {
      logger.info('Real-time: execution complete, refreshing logs')
      setTimeout(() => fetchLogs(1), 500)
    })
  }, [onExecutionComplete, fetchLogs])

  // ─── Filter helpers ────────────────────────────────────────────────────────

  const getActiveFiltersCount = () => {
    let count = 0
    if (timeRange !== 'All time') count++
    if (level !== 'all') count++
    if (workflowIds.length > 0) count++
    if (folderIds.length > 0) count++
    if (triggers.length > 0) count++
    if (searchQuery.trim()) count++
    return count
  }

  const clearAllFilters = () => {
    const {
      setTimeRange,
      setLevel,
      setWorkflowIds,
      setFolderIds,
      setTriggers,
      setSearchQuery: setStoreSearchQuery,
    } = useFilterStore.getState()
    setTimeRange('All time')
    setLevel('all')
    setWorkflowIds([])
    setFolderIds([])
    setTriggers([])
    setStoreSearchQuery('')
    setSearchQuery('')
  }

  // ─── Init & filter-driven fetching ─────────────────────────────────────────

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true
      initializeFromURL()
    }
  }, [initializeFromURL])

  useEffect(() => {
    const handlePopState = () => initializeFromURL()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [initializeFromURL])

  useEffect(() => {
    if (!isInitialized.current) return

    setPage(1)
    setHasMore(true)

    const fetchWithFilters = async () => {
      try {
        setLoading(true)
        const queryParams = new URLSearchParams()
        queryParams.set('includeWorkflow', 'true')
        queryParams.set('limit', LOGS_PER_PAGE.toString())
        queryParams.set('offset', '0')
        queryParams.set('workspaceId', workspaceId)

        if (level !== 'all') queryParams.set('level', level)
        if (triggers.length > 0) queryParams.set('triggers', triggers.join(','))
        if (workflowIds.length > 0) queryParams.set('workflowIds', workflowIds.join(','))
        if (folderIds.length > 0) queryParams.set('folderIds', folderIds.join(','))
        if (searchQuery.trim()) queryParams.set('search', searchQuery.trim())

        if (timeRange !== 'All time') {
          const now = new Date()
          let startDate: Date
          switch (timeRange) {
            case 'Past 30 minutes':
              startDate = new Date(now.getTime() - 30 * 60 * 1000)
              break
            case 'Past hour':
              startDate = new Date(now.getTime() - 60 * 60 * 1000)
              break
            case 'Past 24 hours':
              startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
              break
            default:
              startDate = new Date(0)
          }
          queryParams.set('startDate', startDate.toISOString())
        }

        const response = await fetch(`/api/logs?${queryParams.toString()}`)
        if (!response.ok) throw new Error(`Error fetching logs: ${response.statusText}`)
        const data: LogsResponse = await response.json()
        setHasMore(data.data.length === LOGS_PER_PAGE && data.page < data.totalPages)
        setLogs(data.data, false)
        setError(null)
      } catch (err) {
        logger.error('Failed to fetch logs:', { err })
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchWithFilters()
  }, [workspaceId, timeRange, level, workflowIds, folderIds, searchQuery, triggers])

  // ─── Infinite scroll ───────────────────────────────────────────────────────

  const loadMoreLogs = useCallback(() => {
    if (!isFetchingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      setIsFetchingMore(true)
      setTimeout(() => fetchLogs(nextPage, true), 50)
    }
  }, [fetchLogs, isFetchingMore, hasMore, page])

  useEffect(() => {
    if (loading || !hasMore) return
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return
    const handleScroll = () => {
      if (!scrollContainer) return
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer
      const pct = (scrollTop / (scrollHeight - clientHeight)) * 100
      if (pct > 60 && !isFetchingMore && hasMore) loadMoreLogs()
    }
    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [loading, hasMore, isFetchingMore, loadMoreLogs])

  useEffect(() => {
    const currentLoaderRef = loaderRef.current
    const scrollContainer = scrollContainerRef.current
    if (!currentLoaderRef || !scrollContainer || loading || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingMore) loadMoreLogs()
      },
      { root: scrollContainer, threshold: 0.1, rootMargin: '200px 0px 0px 0px' }
    )
    observer.observe(currentLoaderRef)
    return () => observer.unobserve(currentLoaderRef)
  }, [loading, hasMore, isFetchingMore, loadMoreLogs])

  // ─── Keyboard navigation ──────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'f') {
          e.preventDefault()
          setIsFiltersOpen((p) => !p)
          return
        }
        if (e.key === 'k') {
          e.preventDefault()
          clearAllFilters()
          return
        }
        if (e.key === '/') {
          e.preventDefault()
          const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
          input?.focus()
          return
        }
      }

      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.contentEditable === 'true'
        )
          return
        if (e.key === 'f') {
          e.preventDefault()
          setIsFiltersOpen((p) => !p)
          return
        }
      }

      if (logs.length === 0) return
      if (selectedLogIndex === -1 && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault()
        setSelectedLogIndex(0)
        setSelectedLog(logs[0])
        return
      }
      if (e.key === 'ArrowUp' && !e.metaKey && !e.ctrlKey && selectedLogIndex > 0) {
        e.preventDefault()
        handleNavigatePrev()
      }
      if (e.key === 'ArrowDown' && !e.metaKey && !e.ctrlKey && selectedLogIndex < logs.length - 1) {
        e.preventDefault()
        handleNavigateNext()
      }
      if (e.key === 'Enter' && selectedLog) {
        e.preventDefault()
        setIsSidebarOpen(!isSidebarOpen)
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        if (isSidebarOpen) setIsSidebarOpen(false)
        else if (isFiltersOpen) setIsFiltersOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    logs,
    selectedLogIndex,
    isSidebarOpen,
    selectedLog,
    handleNavigateNext,
    handleNavigatePrev,
    isFiltersOpen,
  ])

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════
  const activeFilters = getActiveFiltersCount()

  return (
    <div className='flex h-full min-w-0 flex-col bg-background'>
      <div className='flex min-w-0 flex-1 overflow-hidden'>
        {/* Filter Sidebar */}
        <div
          className={cn(
            'border-border/40 border-r bg-background transition-all duration-200',
            isFiltersOpen ? 'w-56 sm:w-64' : 'w-0 overflow-hidden'
          )}
        >
          {isFiltersOpen && (
            <div className='flex h-full flex-col'>
              <div className='border-border/40 border-b px-4 py-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h2 className='font-semibold text-foreground text-sm'>Filters</h2>
                    <p className='mt-0.5 text-[11px] text-muted-foreground'>
                      {activeFilters === 0
                        ? 'No filters applied'
                        : `${activeFilters} filter${activeFilters === 1 ? '' : 's'} active`}
                    </p>
                  </div>
                  {activeFilters > 0 && (
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={clearAllFilters}
                      className='h-7 px-2 text-muted-foreground text-xs hover:text-foreground'
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              </div>
              <div className='flex-1 overflow-auto'>
                <Filters />
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className='flex flex-1 flex-col overflow-auto'>
          {/* Header */}
          <div className='sticky top-0 z-10 border-border/40 border-b bg-background/95 backdrop-blur-lg'>
            <div className='px-4 py-3 sm:px-6 sm:py-4'>
              {/* Title */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2.5'>
                  <h1 className='font-semibold text-foreground text-lg tracking-tight sm:text-xl'>
                    Workflow Logs
                  </h1>
                  {isLive && (
                    <div className='flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5'>
                      <span className='relative flex h-2 w-2'>
                        <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-50' />
                        <span className='relative inline-flex h-2 w-2 rounded-full bg-emerald-500' />
                      </span>
                      <span className='font-medium text-[11px] text-emerald-600 uppercase tracking-wider dark:text-emerald-400'>
                        Live
                      </span>
                    </div>
                  )}
                </div>
                <div className='flex items-center gap-1.5'>
                  <button
                    type='button'
                    onClick={() => setShowStats((s) => !s)}
                    className='hidden items-center rounded-lg px-2.5 py-1 text-[11px] text-muted-foreground/60 transition-colors hover:bg-muted/50 hover:text-muted-foreground sm:inline-flex'
                  >
                    <ChevronDown
                      className={cn(
                        'mr-1 h-3 w-3 transition-transform duration-200',
                        showStats && 'rotate-180'
                      )}
                    />
                    Stats
                  </button>
                  <span className='rounded-full bg-muted/50 px-3 py-1 font-medium text-xs text-muted-foreground tabular-nums'>
                    {logs.length} {logs.length === 1 ? 'log' : 'logs'}
                  </span>
                </div>
              </div>

              {/* Stats */}
              {showStats && logs.length > 0 && (
                <div className='mt-4'>
                  <StatsSummary logs={logs} />
                </div>
              )}
            </div>
          </div>

          {/* Search & Controls */}
          <div className='border-border/40 border-b bg-background px-4 py-2.5 sm:px-6 sm:py-3'>
            {/* Active filter pills */}
            {activeFilters > 0 && (
              <div className='mb-3 flex items-center gap-2'>
                <div className='flex flex-1 flex-wrap items-center gap-1.5'>
                  {timeRange !== 'All time' && (
                    <span className='inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-xs'>
                      <span className='text-muted-foreground'>Time:</span>
                      <span className='font-medium text-foreground'>{timeRange}</span>
                    </span>
                  )}
                  {level !== 'all' && (
                    <span className='inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-xs'>
                      <span className='text-muted-foreground'>Level:</span>
                      <span className='font-medium text-foreground capitalize'>{level}</span>
                    </span>
                  )}
                  {workflowIds.length > 0 && (
                    <span className='inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-xs'>
                      <span className='text-muted-foreground'>Workflows:</span>
                      <span className='font-medium text-foreground'>{workflowIds.length}</span>
                    </span>
                  )}
                  {folderIds.length > 0 && (
                    <span className='inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-xs'>
                      <span className='text-muted-foreground'>Folders:</span>
                      <span className='font-medium text-foreground'>{folderIds.length}</span>
                    </span>
                  )}
                  {triggers.length > 0 && (
                    <span className='inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-xs'>
                      <span className='text-muted-foreground'>Triggers:</span>
                      <span className='font-medium text-foreground'>{triggers.length}</span>
                    </span>
                  )}
                  {searchQuery.trim() && (
                    <span className='inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-xs'>
                      <span className='text-muted-foreground'>Search:</span>
                      <span className='max-w-20 truncate font-medium text-foreground'>
                        {searchQuery}
                      </span>
                    </span>
                  )}
                </div>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={clearAllFilters}
                  className='h-6 shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground'
                >
                  Clear all
                </Button>
              </div>
            )}

            <div className='flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between'>
              {/* Search */}
              <div className='relative max-w-full flex-1 sm:max-w-md'>
                <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                  <Search className='h-3.5 w-3.5 text-muted-foreground/50' />
                </div>
                <Input
                  placeholder='Search logs, workflows, or execution IDs...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='h-9 rounded-lg border-border/50 bg-muted/20 pr-8 pl-9 text-[13px] placeholder:text-muted-foreground/40 focus:border-border focus:bg-background focus:ring-1 focus:ring-ring/20'
                />
                {searchQuery && (
                  <div className='absolute inset-y-0 right-0 flex items-center pr-2.5'>
                    <button
                      type='button'
                      aria-label='Clear search'
                      onClick={() => setSearchQuery('')}
                      className='flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className='flex flex-shrink-0 items-center gap-2'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setIsFiltersOpen((p) => !p)}
                      className={cn(
                        'relative h-8 rounded-lg px-3 font-medium text-[13px] transition-colors',
                        isFiltersOpen
                          ? 'bg-foreground text-background'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      )}
                    >
                      <Filter className='h-3.5 w-3.5 sm:mr-1.5' />
                      <span className='hidden sm:inline'>Filters</span>
                      {activeFilters > 0 && (
                        <span className='ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-medium text-[10px] text-primary-foreground'>
                          {activeFilters}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>
                    {isFiltersOpen ? 'Hide filters (F)' : 'Show filters (F)'}
                  </TooltipContent>
                </Tooltip>

                <div className='mx-0.5 h-4 w-px bg-border/40' />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={handleRefresh}
                      className='h-8 rounded-lg px-2.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? (
                        <Loader2 className='h-3.5 w-3.5 animate-spin' />
                      ) : (
                        <RefreshCw className='h-3.5 w-3.5' />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size='sm'
                      variant='ghost'
                      className={cn(
                        'h-8 rounded-lg px-3 font-medium text-[13px] transition-colors',
                        isLive
                          ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      )}
                      onClick={() => setIsLive(!isLive)}
                    >
                      {isLive ? (
                        <>
                          <span className='relative mr-1.5 flex h-2 w-2'>
                            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-50' />
                            <span className='relative inline-flex h-2 w-2 rounded-full bg-emerald-500' />
                          </span>
                          <span>Live</span>
                        </>
                      ) : (
                        <>
                          <Play className='h-3.5 w-3.5 sm:mr-1.5' />
                          <span className='hidden sm:inline'>Go Live</span>
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>
                    {isLive ? 'Auto-refreshing every 5s' : 'Enable live mode'}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Log list */}
          <div className='logs-scroll relative flex-1 overflow-auto' ref={scrollContainerRef}>
            {/* Loading bar */}
            {(isRefreshing || (loading && logs.length > 0)) && (
              <div className='pointer-events-none absolute top-0 right-0 left-0 z-20 h-[2px] overflow-hidden bg-primary/10'>
                <div className='logs-shimmer h-full w-1/3 bg-primary/50' />
              </div>
            )}

            {loading && page === 1 && logs.length === 0 ? (
              <div className='flex h-96 items-center justify-center'>
                <div className='text-center'>
                  <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10'>
                    <Loader2 className='h-5 w-5 animate-spin text-primary' />
                  </div>
                  <p className='font-medium text-sm text-foreground'>Loading logs...</p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Fetching workflow execution data
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className='flex h-96 items-center justify-center'>
                <div className='max-w-sm text-center'>
                  <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10'>
                    <AlertCircle className='h-5 w-5 text-destructive' />
                  </div>
                  <p className='font-medium text-sm text-foreground'>Unable to load logs</p>
                  <p className='mt-1 mb-4 text-xs text-muted-foreground'>{error}</p>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleRefresh}
                    className='h-8 rounded-lg text-[13px]'
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <>
                        <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className='mr-1.5 h-3.5 w-3.5' />
                        Try Again
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : logs.length === 0 ? (
              <div className='flex h-96 items-center justify-center'>
                <div className='max-w-sm text-center'>
                  <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50'>
                    <Search className='h-5 w-5 text-muted-foreground' />
                  </div>
                  <p className='font-medium text-sm text-foreground'>No logs found</p>
                  <p className='mt-1 mb-4 text-xs text-muted-foreground'>
                    {searchQuery
                      ? `No results for "${searchQuery}". Try different search terms.`
                      : 'No workflow executions recorded yet. Logs will appear here once workflows run.'}
                  </p>
                  {searchQuery && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setSearchQuery('')}
                      className='h-8 rounded-lg text-[13px]'
                    >
                      <X className='mr-1.5 h-3.5 w-3.5' />
                      Clear Search
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className='px-4 pt-3 pb-6 sm:px-6'>
                {groupedLogs.map((group) => (
                  <div key={group.label} className='mb-3'>
                    {/* Group heading */}
                    <div className='-mx-4 sm:-mx-6 sticky top-0 z-[5] mb-2 flex items-center gap-3 bg-background/95 px-4 py-1.5 backdrop-blur-sm sm:px-6'>
                      <span className='font-semibold text-[11px] text-foreground/50 uppercase tracking-wider'>
                        {group.label}
                      </span>
                      <div className='h-px flex-1 bg-border/30' />
                      <span className='rounded-full bg-muted/50 px-2 py-0.5 font-medium text-[10px] text-muted-foreground tabular-nums'>
                        {group.logs.length}
                      </span>
                    </div>

                    {/* Rows */}
                    <div className='space-y-1.5'>
                      {group.logs.map((log) => (
                        <LogRow
                          key={log.id}
                          log={log}
                          isSelected={selectedLog?.id === log.id}
                          maxDuration={maxDuration}
                          onClick={() => handleLogClick(log)}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Infinite scroll loader */}
                {hasMore && (
                  <div className='flex items-center justify-center py-8'>
                    <div ref={loaderRef} className='flex items-center gap-2'>
                      {isFetchingMore ? (
                        <>
                          <Loader2 className='h-3.5 w-3.5 animate-spin text-muted-foreground' />
                          <span className='text-xs text-muted-foreground'>Loading more...</span>
                        </>
                      ) : (
                        <span className='text-xs text-muted-foreground/50'>Scroll for more</span>
                      )}
                    </div>
                  </div>
                )}

                {/* End */}
                {!hasMore && logs.length > 0 && (
                  <div className='flex items-center justify-center py-6'>
                    <span className='text-xs text-muted-foreground/40'>
                      End — {logs.length} logs loaded
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        log={selectedLog}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onNavigateNext={handleNavigateNext}
        onNavigatePrev={handleNavigatePrev}
        hasNext={selectedLogIndex < logs.length - 1}
        hasPrev={selectedLogIndex > 0}
      />
    </div>
  )
}
