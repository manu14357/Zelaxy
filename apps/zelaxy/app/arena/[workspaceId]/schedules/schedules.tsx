'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  List,
  MoreHorizontal,
  Pause,
  Play,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { createLogger } from '@/lib/logs/console/logger'
import { parseCronToHumanReadable } from '@/lib/schedules/utils'
import { useUserPermissionsContext } from '@/app/arena/[workspaceId]/providers/workspace-permissions-provider'
import { ScheduleCalendar } from '@/app/arena/[workspaceId]/schedules/components/schedule-calendar'

const logger = createLogger('Schedules')

interface ScheduleItem {
  id: string
  workflowId: string
  workflowName: string
  blockId: string | null
  cronExpression: string | null
  nextRunAt: string | null
  lastRanAt: string | null
  lastFailedAt: string | null
  status: 'active' | 'disabled'
  failedCount: number
  timezone: string
  triggerType: string
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function Schedules() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string
  const userPermissions = useUserPermissionsContext()

  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'calendar'>('calendar')

  const fetchSchedules = useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/schedules/list?workspaceId=${encodeURIComponent(workspaceId)}`)
      if (!res.ok) throw new Error(`Failed to load schedules (${res.status})`)
      const json = await res.json()
      setSchedules(json.schedules ?? [])
    } catch (err) {
      logger.error('Error loading schedules:', err)
      setError(err instanceof Error ? err.message : 'Failed to load schedules')
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const toggleStatus = useCallback(
    async (schedule: ScheduleItem) => {
      const action = schedule.status === 'active' ? 'disable' : 'reactivate'
      setBusyId(schedule.id)
      try {
        const res = await fetch(`/api/schedules/${schedule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        })
        if (!res.ok) throw new Error(`Failed to update schedule (${res.status})`)
        await fetchSchedules()
      } catch (err) {
        logger.error('Error updating schedule:', err)
      } finally {
        setBusyId(null)
      }
    },
    [fetchSchedules]
  )

  const deleteSchedule = useCallback(async (schedule: ScheduleItem) => {
    setBusyId(schedule.id)
    try {
      const res = await fetch(`/api/schedules/${schedule.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Failed to delete schedule (${res.status})`)
      setSchedules((prev) => prev.filter((s) => s.id !== schedule.id))
    } catch (err) {
      logger.error('Error deleting schedule:', err)
    } finally {
      setBusyId(null)
    }
  }, [])

  const stats = useMemo(() => {
    const active = schedules.filter((s) => s.status === 'active').length
    const failing = schedules.filter((s) => s.failedCount > 0).length
    return { total: schedules.length, active, failing }
  }, [schedules])

  const canEdit = userPermissions.canEdit === true

  return (
    <div className='flex h-full min-w-0 flex-col bg-background'>
      {/* Header */}
      <div className='flex-shrink-0 border-border/40 border-b bg-card/30 px-4 py-4 sm:px-6'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-3'>
            <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
              <CalendarClock className='h-4 w-4 text-primary' />
            </div>
            <div>
              <h1 className='font-semibold text-[15px] text-foreground leading-none'>Schedules</h1>
              <p className='mt-1 hidden text-[12px] text-muted-foreground sm:block'>
                {stats.total} schedule{stats.total === 1 ? '' : 's'} · {stats.active} active
                {stats.failing > 0 ? ` · ${stats.failing} failing` : ''}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-0.5 rounded-lg border border-border/50 bg-muted/30 p-0.5'>
              <Button
                variant={view === 'calendar' ? 'default' : 'ghost'}
                size='sm'
                className='h-7 px-2 text-xs'
                onClick={() => setView('calendar')}
              >
                <CalendarDays className='h-3.5 w-3.5' />
                <span className='ml-1 hidden sm:inline'>Calendar</span>
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'ghost'}
                size='sm'
                className='h-7 px-2 text-xs'
                onClick={() => setView('list')}
              >
                <List className='h-3.5 w-3.5' />
                <span className='ml-1 hidden sm:inline'>List</span>
              </Button>
            </div>
            <Button variant='ghost' size='sm' onClick={fetchSchedules} disabled={isLoading}>
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className='ml-1.5 hidden sm:inline'>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-auto px-4 py-4 sm:px-6'>
        {isLoading ? (
          <div className='space-y-2'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-14 w-full rounded-lg' />
            ))}
          </div>
        ) : error ? (
          <div className='flex flex-col items-center justify-center gap-2 py-16 text-center'>
            <AlertCircle className='h-8 w-8 text-destructive/70' />
            <p className='text-muted-foreground text-sm'>{error}</p>
            <Button variant='outline' size='sm' onClick={fetchSchedules}>
              Try again
            </Button>
          </div>
        ) : schedules.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-2 py-16 text-center'>
            <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50'>
              <CalendarClock className='h-6 w-6 text-muted-foreground' />
            </div>
            <p className='font-medium text-foreground text-sm'>No schedules yet</p>
            <p className='max-w-sm text-muted-foreground text-xs'>
              Add a Schedule trigger to a workflow to run it automatically on a recurring basis.
            </p>
          </div>
        ) : view === 'calendar' ? (
          <ScheduleCalendar
            schedules={schedules}
            onOpenWorkflow={(workflowId) =>
              router.push(`/arena/${workspaceId}/zelaxy/${workflowId}`)
            }
          />
        ) : (
          <div className='overflow-hidden rounded-xl border border-border/50'>
            {/* Column header */}
            <div className='hidden grid-cols-[2fr_1fr_1.2fr_1.2fr_0.8fr_40px] gap-3 border-border/40 border-b bg-muted/30 px-4 py-2.5 font-medium text-[11px] text-muted-foreground uppercase tracking-wide sm:grid'>
              <span>Workflow</span>
              <span>Schedule</span>
              <span>Next run</span>
              <span>Last run</span>
              <span>Status</span>
              <span />
            </div>
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className='grid grid-cols-1 gap-2 border-border/30 border-b px-4 py-3 text-sm last:border-b-0 hover:bg-muted/20 sm:grid-cols-[2fr_1fr_1.2fr_1.2fr_0.8fr_40px] sm:items-center sm:gap-3'
              >
                <button
                  type='button'
                  onClick={() => router.push(`/arena/${workspaceId}/zelaxy/${schedule.workflowId}`)}
                  className='flex items-center gap-2 truncate text-left font-medium text-foreground hover:text-primary'
                >
                  <ExternalLink className='h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/60' />
                  <span className='truncate'>{schedule.workflowName || 'Untitled workflow'}</span>
                </button>
                <span className='truncate text-[12px] text-muted-foreground'>
                  {schedule.cronExpression ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className='cursor-default'>
                          {parseCronToHumanReadable(schedule.cronExpression)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className='font-mono'>
                        {schedule.cronExpression}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    schedule.triggerType
                  )}
                </span>
                <span className='flex items-center gap-1.5 text-[12px] text-muted-foreground'>
                  <Clock className='h-3 w-3' />
                  {schedule.status === 'active' ? formatDate(schedule.nextRunAt) : 'Paused'}
                </span>
                <span className='text-[12px] text-muted-foreground'>
                  {formatDate(schedule.lastRanAt)}
                </span>
                <span>
                  {schedule.failedCount > 0 ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant='destructive' className='gap-1'>
                          <AlertCircle className='h-3 w-3' />
                          Failing
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {schedule.failedCount} consecutive failure
                        {schedule.failedCount === 1 ? '' : 's'}
                      </TooltipContent>
                    </Tooltip>
                  ) : schedule.status === 'active' ? (
                    <Badge
                      variant='secondary'
                      className='gap-1 text-emerald-600 dark:text-emerald-400'
                    >
                      <CheckCircle2 className='h-3 w-3' />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant='outline' className='gap-1 text-muted-foreground'>
                      <Pause className='h-3 w-3' />
                      Paused
                    </Badge>
                  )}
                </span>
                <div className='flex justify-end'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7'
                        disabled={busyId === schedule.id}
                      >
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/arena/${workspaceId}/zelaxy/${schedule.workflowId}`)
                        }
                      >
                        <ExternalLink className='mr-2 h-3.5 w-3.5' />
                        Open workflow
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={!canEdit} onClick={() => toggleStatus(schedule)}>
                        {schedule.status === 'active' ? (
                          <>
                            <Pause className='mr-2 h-3.5 w-3.5' />
                            Disable
                          </>
                        ) : (
                          <>
                            <Play className='mr-2 h-3.5 w-3.5' />
                            Enable
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!canEdit}
                        className='text-destructive focus:text-destructive'
                        onClick={() => deleteSchedule(schedule)}
                      >
                        <Trash2 className='mr-2 h-3.5 w-3.5' />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Schedules
