/**
 * Enhanced Workflow Logs — Immersive Timeline UI
 *
 * A first-of-its-kind logs viewer combining timeline visualization,
 * card-based entries, and animated micro-interactions.
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Bot,
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

// ─── Trigger Icon Map ────────────────────────────────────────────────────────
const TriggerIcon = ({
  trigger,
  className,
}: {
  trigger: string | null | undefined
  className?: string
}) => {
  const iconClass = cn('h-3.5 w-3.5', className)
  switch (trigger?.toLowerCase()) {
    case 'chat':
      return <MessageSquare className={iconClass} />
    case 'api':
      return <Globe className={iconClass} />
    case 'webhook':
      return <Zap className={iconClass} />
    case 'schedule':
      return <Timer className={iconClass} />
    case 'manual':
      return <Play className={iconClass} />
    default:
      return <Bot className={iconClass} />
  }
}

const getTriggerAccent = (trigger: string | null | undefined): string => {
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

// ─── Duration Bar — visual proportional width ────────────────────────────────
const DurationBar = ({
  duration,
  maxDuration,
}: {
  duration: string | null
  maxDuration: number
}) => {
  const ms = parseDurationMs(duration)
  if (!ms || !maxDuration) return null
  const pct = Math.min((ms / maxDuration) * 100, 100)
  const color = ms > 30000 ? 'bg-red-500/60' : ms > 10000 ? 'bg-amber-500/60' : 'bg-emerald-500/50'
  return (
    <div className='mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-muted/40'>
      <div
        className={cn('h-full rounded-full transition-all duration-700 ease-out', color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

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

// ─── Time Group Heading ──────────────────────────────────────────────────────
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

// ─── Stats Summary Strip ────────────────────────────────────────────────────
const StatsSummary = ({ logs }: { logs: WorkflowLog[] }) => {
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

  const formatMs = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  return (
    <div className='grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5'>
      {/* Total Executions */}
      <div className='group relative overflow-hidden rounded-xl border border-border/40 bg-card/50 p-3 transition-all duration-200 hover:border-border/60 hover:shadow-sm'>
        <div className='flex items-center gap-2'>
          <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10'>
            <Zap className='h-3.5 w-3.5 text-primary' />
          </div>
          <div>
            <div className='font-semibold text-[18px] text-foreground tabular-nums leading-none'>
              {stats.total}
            </div>
            <div className='mt-0.5 text-[10px] text-muted-foreground uppercase tracking-wider'>
              Executions
            </div>
          </div>
        </div>
      </div>

      {/* Success Rate */}
      <div className='group relative overflow-hidden rounded-xl border border-border/40 bg-card/50 p-3 transition-all duration-200 hover:border-border/60 hover:shadow-sm'>
        <div className='flex items-center gap-2'>
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg',
              stats.successRate >= 90
                ? 'bg-emerald-500/10'
                : stats.successRate >= 70
                  ? 'bg-amber-500/10'
                  : 'bg-red-500/10'
            )}
          >
            <Radio
              className={cn(
                'h-3.5 w-3.5',
                stats.successRate >= 90
                  ? 'text-emerald-500'
                  : stats.successRate >= 70
                    ? 'text-amber-500'
                    : 'text-red-500'
              )}
            />
          </div>
          <div>
            <div className='font-semibold text-[18px] text-foreground tabular-nums leading-none'>
              {stats.successRate}%
            </div>
            <div className='mt-0.5 text-[10px] text-muted-foreground uppercase tracking-wider'>
              Success
            </div>
          </div>
        </div>
        {/* Mini success bar */}
        <div className='mt-2 h-1 w-full overflow-hidden rounded-full bg-muted/40'>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-1000 ease-out',
              stats.successRate >= 90
                ? 'bg-emerald-500/60'
                : stats.successRate >= 70
                  ? 'bg-amber-500/60'
                  : 'bg-red-500/60'
            )}
            style={{ width: `${stats.successRate}%` }}
          />
        </div>
      </div>

      {/* Errors */}
      <div className='group relative overflow-hidden rounded-xl border border-border/40 bg-card/50 p-3 transition-all duration-200 hover:border-border/60 hover:shadow-sm'>
        <div className='flex items-center gap-2'>
          <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10'>
            <AlertCircle className='h-3.5 w-3.5 text-red-500' />
          </div>
          <div>
            <div className='font-semibold text-[18px] text-foreground tabular-nums leading-none'>
              {stats.errors}
            </div>
            <div className='mt-0.5 text-[10px] text-muted-foreground uppercase tracking-wider'>
              Errors
            </div>
          </div>
        </div>
      </div>

      {/* Avg Duration */}
      <div className='group relative overflow-hidden rounded-xl border border-border/40 bg-card/50 p-3 transition-all duration-200 hover:border-border/60 hover:shadow-sm'>
        <div className='flex items-center gap-2'>
          <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10'>
            <Clock className='h-3.5 w-3.5 text-blue-500' />
          </div>
          <div>
            <div className='font-semibold text-[18px] text-foreground tabular-nums leading-none'>
              {formatMs(stats.avgDuration)}
            </div>
            <div className='mt-0.5 text-[10px] text-muted-foreground uppercase tracking-wider'>
              Avg Time
            </div>
          </div>
        </div>
      </div>

      {/* Top Trigger */}
      <div className='col-span-2 hidden overflow-hidden rounded-xl border border-border/40 bg-card/50 p-3 transition-all duration-200 hover:border-border/60 hover:shadow-sm sm:col-span-1 lg:block'>
        <div className='flex items-center gap-2'>
          <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10'>
            <TriggerIcon trigger={stats.topTrigger} className='text-violet-500' />
          </div>
          <div>
            <div className='font-semibold text-[14px] text-foreground capitalize leading-none'>
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

// ─── Single Log Card ─────────────────────────────────────────────────────────
interface LogCardProps {
  log: WorkflowLog
  isSelected: boolean
  index: number
  maxDuration: number
  onClick: () => void
}

const LogCard = ({ log, isSelected, index, maxDuration, onClick }: LogCardProps) => {
  const formattedDate = formatDate(log.createdAt)
  const isError = log.level === 'error'
  const isRunning = log.message === 'Running...'
  const triggerAccent = getTriggerAccent(log.trigger)
  const blockCount =
    (log.metadata as any)?.blockStats?.total || (log.metadata as any)?.traceSpans?.length || 0

  const ms = parseDurationMs(log.duration)
  const barPct = ms && maxDuration ? Math.min((ms / maxDuration) * 100, 100) : isRunning ? 60 : 0

  return (
    <div
      className={cn(
        'log-card group relative cursor-pointer overflow-hidden rounded-xl border transition-all duration-200',
        isSelected
          ? 'border-primary/40 bg-primary/[0.04] shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]'
          : 'border-border/50 bg-card/50 hover:border-border/70 hover:bg-card/80 hover:shadow-sm',
        isError && !isSelected && 'border-red-500/20 hover:border-red-500/30',
        isRunning && !isSelected && 'border-blue-500/20'
      )}
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
      onClick={onClick}
    >
      {/* Selection accent line */}
      {isSelected && <div className='absolute inset-y-2 left-0 w-[3px] rounded-full bg-primary' />}

      {/* Single content row */}
      <div className='flex items-center gap-2.5 px-4 pt-3 pb-2.5'>
        {/* Trigger icon */}
        <div
          className={cn(
            'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border transition-colors duration-200',
            triggerAccent
          )}
        >
          {isRunning ? (
            <Loader2 className='h-3.5 w-3.5 animate-spin' />
          ) : (
            <TriggerIcon trigger={log.trigger} />
          )}
        </div>

        {/* Workflow name badge */}
        {log.workflow && (
          <span
            className='inline-flex flex-shrink-0 items-center gap-1.5 rounded-md border px-1.5 py-0.5 font-medium text-[11px]'
            style={{
              color: log.workflow.color,
              backgroundColor: `${log.workflow.color}10`,
              borderColor: `${log.workflow.color}20`,
            }}
          >
            <span
              className='h-1.5 w-1.5 rounded-full'
              style={{ backgroundColor: log.workflow.color }}
            />
            {log.workflow.name}
          </span>
        )}

        {/* Message text */}
        <span className='min-w-0 flex-1 truncate text-[12px] text-muted-foreground'>
          {log.message}
        </span>

        {/* Status badge */}
        {isError && (
          <span className='inline-flex flex-shrink-0 items-center gap-1 rounded-md bg-red-500/10 px-1.5 py-0.5 font-medium text-[10px] text-red-500'>
            <AlertCircle className='h-2.5 w-2.5' />
            Error
          </span>
        )}
        {!isError && !isRunning && (
          <span className='inline-flex flex-shrink-0 items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-medium text-[10px] text-emerald-600 dark:text-emerald-400'>
            Completed
          </span>
        )}
        {isRunning && (
          <span className='inline-flex flex-shrink-0 items-center gap-1 rounded-md bg-blue-500/10 px-1.5 py-0.5 font-medium text-[10px] text-blue-500'>
            <Loader2 className='h-2.5 w-2.5 animate-spin' />
            Running
          </span>
        )}

        {/* Right-side metadata chips */}
        <div className='flex flex-shrink-0 items-center gap-2 text-[11px] text-muted-foreground/70'>
          {blockCount > 0 && (
            <>
              <span className='text-muted-foreground/30'>·</span>
              <span className='tabular-nums'>
                {blockCount} block{blockCount !== 1 ? 's' : ''}
              </span>
            </>
          )}
          {log.duration && (
            <>
              <span className='text-muted-foreground/30'>·</span>
              <span className='font-medium text-foreground/60 tabular-nums'>{log.duration}</span>
            </>
          )}
          <span className='text-muted-foreground/30'>·</span>
          <span className='tabular-nums'>{formattedDate.relative}</span>
          <span className='text-muted-foreground/30'>·</span>
          <span className='font-medium tabular-nums'>{formattedDate.compactTime}</span>
          <span className='font-mono text-[10px] text-muted-foreground/40'>
            #{log.id.slice(-4)}
          </span>
          <ArrowRight
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground/30 transition-all duration-200',
              'opacity-0 group-hover:opacity-100',
              isSelected && 'text-primary/50 opacity-100'
            )}
          />
        </div>
      </div>

      {/* Line 2: progress bar */}
      <div className='h-[3px] w-full bg-muted/30'>
        {isRunning ? (
          <div className='h-full w-full origin-left animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-emerald-500/0 via-emerald-500/70 to-emerald-500/0' />
        ) : barPct > 0 ? (
          <div
            className={cn(
              'h-full rounded-r-full transition-all duration-700 ease-out',
              isError ? 'bg-red-500/60' : ms > 30000 ? 'bg-amber-500/60' : 'bg-emerald-500/60'
            )}
            style={{ width: `${barPct}%` }}
          />
        ) : null}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
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

  // Max duration for proportional bars
  const maxDuration = useMemo(
    () => Math.max(...logs.map((l) => parseDurationMs(l.duration)), 1),
    [logs]
  )

  // Group logs by time
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

  const fetchLogs = useCallback(async (pageNum: number, append = false) => {
    try {
      if (pageNum > 1) {
        setIsFetchingMore(true)
      }

      const { buildQueryParams: getCurrentQueryParams } = useFilterStore.getState()
      const queryParams = getCurrentQueryParams(pageNum, LOGS_PER_PAGE)
      const response = await fetch(`/api/logs?${queryParams}`)

      if (!response.ok) {
        throw new Error(`Error fetching logs: ${response.statusText}`)
      }

      const data: LogsResponse = await response.json()
      setHasMore(data.data.length === LOGS_PER_PAGE && data.page < data.totalPages)
      setLogs(data.data, append)
      setError(null)
    } catch (err) {
      logger.error('Failed to fetch logs:', { err })
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      if (pageNum > 1) {
        setIsFetchingMore(false)
      }
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

  // ─── Socket.IO (Real-time) ─────────────────────────────────────────────────
  const {
    isConnected: socketConnected,
    joinWorkspace,
    leaveWorkspace,
    onExecutionStarted,
    onExecutionBlockComplete,
    onExecutionComplete,
  } = useSocket()

  useEffect(() => {
    if (socketConnected && workspaceId) {
      joinWorkspace(workspaceId)
    }
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
      useFilterStore.setState((state) => ({
        logs: [inProgressLog, ...state.logs],
      }))
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
              metadata: {
                ...log.metadata,
                traceSpans: [...existingSpans, data.traceSpan],
              },
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
      setTimeout(() => {
        fetchLogs(1)
      }, 500)
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

  // ─── Initialization & data fetching ────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true
      initializeFromURL()
    }
  }, [initializeFromURL])

  useEffect(() => {
    const handlePopState = () => {
      initializeFromURL()
    }
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
        const params = new URLSearchParams()
        params.set('includeWorkflow', 'true')
        params.set('limit', LOGS_PER_PAGE.toString())
        params.set('offset', '0')
        params.set('workspaceId', workspaceId)

        if (level !== 'all') params.set('level', level)
        if (triggers.length > 0) params.set('triggers', triggers.join(','))
        if (workflowIds.length > 0) params.set('workflowIds', workflowIds.join(','))
        if (folderIds.length > 0) params.set('folderIds', folderIds.join(','))
        if (searchQuery.trim()) params.set('search', searchQuery.trim())

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
          params.set('startDate', startDate.toISOString())
        }

        const response = await fetch(`/api/logs?${params.toString()}`)
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

  const loadMoreLogs = useCallback(() => {
    if (!isFetchingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      setIsFetchingMore(true)
      setTimeout(() => {
        fetchLogs(nextPage, true)
      }, 50)
    }
  }, [fetchLogs, isFetchingMore, hasMore, page])

  // Scroll-based infinite loading
  useEffect(() => {
    if (loading || !hasMore) return
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      if (!scrollContainer) return
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer
      const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100
      if (scrollPercentage > 60 && !isFetchingMore && hasMore) {
        loadMoreLogs()
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [loading, hasMore, isFetchingMore, loadMoreLogs])

  // Intersection observer for infinite scroll
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
        switch (e.key) {
          case 'f':
            e.preventDefault()
            setIsFiltersOpen((p) => !p)
            return
          case 'k':
            e.preventDefault()
            clearAllFilters()
            return
          case '/': {
            e.preventDefault()
            const searchInput = document.querySelector(
              'input[placeholder*="Search"]'
            ) as HTMLInputElement
            searchInput?.focus()
            return
          }
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
        {/* ── Filter Sidebar ────────────────────────────────────────────────── */}
        <div
          className={cn(
            'border-border/40 border-r bg-background/95 backdrop-blur transition-all duration-300 ease-in-out',
            isFiltersOpen ? 'w-52 opacity-100 sm:w-64' : 'w-0 overflow-hidden opacity-0'
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

        {/* ── Main Content ──────────────────────────────────────────────────── */}
        <div className='flex flex-1 flex-col overflow-auto'>
          {/* ── Header ── */}
          <div className='sticky top-0 z-10 border-border/40 border-b bg-background/95 backdrop-blur-xl'>
            <div className='px-3 py-3 sm:px-6 sm:py-4'>
              {/* Title Row */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2 sm:gap-3'>
                  <h1 className='font-semibold text-foreground text-lg tracking-tight sm:text-[22px]'>
                    Workflow Logs
                  </h1>
                  {isLive && (
                    <div className='flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1'>
                      <div className='relative flex h-2 w-2 items-center justify-center'>
                        <div className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
                        <div className='absolute h-2 w-2 animate-ping rounded-full bg-emerald-500 opacity-40' />
                      </div>
                      <span className='font-medium text-[11px] text-emerald-600 uppercase tracking-wider dark:text-emerald-400'>
                        Live
                      </span>
                    </div>
                  )}
                </div>
                <div className='flex items-center gap-1 sm:gap-2'>
                  <button
                    type='button'
                    onClick={() => setShowStats((s) => !s)}
                    className='hidden rounded-lg px-2.5 py-1 text-[11px] text-muted-foreground/60 transition-colors hover:bg-muted/50 hover:text-muted-foreground sm:inline-flex'
                  >
                    <ChevronDown
                      className={cn(
                        'mr-1 inline-block h-3 w-3 transition-transform',
                        showStats && 'rotate-180'
                      )}
                    />
                    Stats
                  </button>
                  <span className='rounded-full bg-muted/50 px-3 py-1 font-medium text-[12px] text-muted-foreground tabular-nums'>
                    {logs.length} {logs.length === 1 ? 'log' : 'logs'}
                  </span>
                </div>
              </div>

              {/* Stats Strip (collapsible) */}
              {showStats && logs.length > 0 && (
                <div className='fade-in slide-in-from-top-2 mt-4 animate-in duration-300'>
                  <StatsSummary logs={logs} />
                </div>
              )}
            </div>
          </div>

          {/* ── Search & Controls ── */}
          <div className='border-border/40 border-b bg-background px-3 py-2 sm:px-6 sm:py-3'>
            {/* Active filter pills */}
            {activeFilters > 0 && (
              <div className='mb-3 flex items-center gap-2'>
                <div className='flex flex-1 flex-wrap items-center gap-1.5'>
                  {timeRange !== 'All time' && (
                    <span className='inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[12px]'>
                      <span className='text-muted-foreground'>Time:</span>
                      <span className='font-medium text-foreground'>{timeRange}</span>
                    </span>
                  )}
                  {level !== 'all' && (
                    <span className='inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[12px]'>
                      <span className='text-muted-foreground'>Level:</span>
                      <span className='font-medium text-foreground capitalize'>{level}</span>
                    </span>
                  )}
                  {workflowIds.length > 0 && (
                    <span className='inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[12px]'>
                      <span className='text-muted-foreground'>Workflows:</span>
                      <span className='font-medium text-foreground'>{workflowIds.length}</span>
                    </span>
                  )}
                  {folderIds.length > 0 && (
                    <span className='inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[12px]'>
                      <span className='text-muted-foreground'>Folders:</span>
                      <span className='font-medium text-foreground'>{folderIds.length}</span>
                    </span>
                  )}
                  {triggers.length > 0 && (
                    <span className='inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[12px]'>
                      <span className='text-muted-foreground'>Triggers:</span>
                      <span className='font-medium text-foreground'>{triggers.length}</span>
                    </span>
                  )}
                  {searchQuery.trim() && (
                    <span className='inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[12px]'>
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
                  className='h-6 shrink-0 px-2 text-[12px] text-muted-foreground hover:text-foreground'
                >
                  Clear all
                </Button>
              </div>
            )}

            <div className='flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center'>
              <div className='relative max-w-full flex-1 sm:max-w-md'>
                <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                  <Search className='h-3.5 w-3.5 text-muted-foreground/60' />
                </div>
                <Input
                  placeholder='Search logs, workflows, or execution IDs...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='h-9 rounded-lg border-border/50 bg-muted/30 pr-8 pl-9 text-[13px] placeholder:text-muted-foreground/50 focus:border-border focus:bg-background focus:ring-1 focus:ring-ring/20'
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

                <div className='mx-0.5 h-4 w-px bg-border/50' />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={handleRefresh}
                      className='h-8 rounded-lg px-2.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground'
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
                          <div className='relative mr-1.5 flex h-2 w-2 items-center justify-center'>
                            <div className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
                            <div className='absolute h-2 w-2 animate-ping rounded-full bg-emerald-500 opacity-40' />
                          </div>
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

          {/* ── Log Cards ──────────────────────────────────────────────────── */}
          <div className='logs-container relative flex-1 overflow-auto' ref={scrollContainerRef}>
            {/* Subtle top progress bar during background refresh */}
            {(isRefreshing || (loading && logs.length > 0)) && (
              <div className='pointer-events-none absolute top-0 right-0 left-0 z-20 h-[2px] overflow-hidden bg-primary/10'>
                <div className='h-full w-1/3 animate-shimmer bg-primary/50' />
              </div>
            )}
            {loading && page === 1 && logs.length === 0 ? (
              /* Loading State — only on initial empty load */
              <div className='flex h-96 items-center justify-center'>
                <div className='text-center'>
                  <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10'>
                    <Loader2 className='h-5 w-5 animate-spin text-primary' />
                  </div>
                  <p className='font-medium text-[13px] text-foreground'>Loading logs...</p>
                  <p className='mt-1 text-[12px] text-muted-foreground'>
                    Fetching workflow execution data
                  </p>
                </div>
              </div>
            ) : error ? (
              /* Error State */
              <div className='flex h-96 items-center justify-center'>
                <div className='max-w-sm text-center'>
                  <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10'>
                    <AlertCircle className='h-5 w-5 text-destructive' />
                  </div>
                  <p className='font-medium text-[13px] text-foreground'>Unable to load logs</p>
                  <p className='mt-1 mb-4 text-[12px] text-muted-foreground leading-relaxed'>
                    {error}
                  </p>
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
              /* Empty State */
              <div className='flex h-96 items-center justify-center'>
                <div className='max-w-sm text-center'>
                  <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50'>
                    <Search className='h-5 w-5 text-muted-foreground' />
                  </div>
                  <p className='font-medium text-[13px] text-foreground'>No logs found</p>
                  <p className='mt-1 mb-4 text-[12px] text-muted-foreground leading-relaxed'>
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
              /* ── Timeline Cards ── */
              <div className='px-3 pt-4 pb-6 sm:px-6'>
                {groupedLogs.map((group) => (
                  <div key={group.label} className='mb-2'>
                    {/* Time group label */}
                    <div className='-mx-3 sm:-mx-6 sticky top-0 z-[5] mb-2 flex items-center gap-3 bg-background/95 px-3 py-2 backdrop-blur-sm sm:px-6'>
                      <span className='font-semibold text-[11px] text-foreground/60 uppercase tracking-wider'>
                        {group.label}
                      </span>
                      <div className='h-px flex-1 bg-border/50' />
                      <span className='rounded-full bg-muted/60 px-2 py-0.5 font-medium text-[10px] text-muted-foreground tabular-nums'>
                        {group.logs.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className='space-y-1.5'>
                      {group.logs.map((log) => {
                        const globalIndex = logs.findIndex((l) => l.id === log.id)
                        return (
                          <LogCard
                            key={log.id}
                            log={log}
                            isSelected={selectedLog?.id === log.id}
                            index={globalIndex}
                            maxDuration={maxDuration}
                            onClick={() => handleLogClick(log)}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}

                {/* Infinite Scroll Loader */}
                {hasMore && (
                  <div className='flex items-center justify-center py-8'>
                    <div ref={loaderRef} className='flex items-center gap-2'>
                      {isFetchingMore ? (
                        <>
                          <Loader2 className='h-3.5 w-3.5 animate-spin text-muted-foreground' />
                          <span className='text-[12px] text-muted-foreground'>Loading more...</span>
                        </>
                      ) : (
                        <span className='text-[12px] text-muted-foreground/50'>
                          Scroll for more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* End indicator */}
                {!hasMore && logs.length > 0 && (
                  <div className='flex items-center justify-center py-6'>
                    <span className='text-[12px] text-muted-foreground/40'>
                      End — {logs.length} logs loaded
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Sidebar */}
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
