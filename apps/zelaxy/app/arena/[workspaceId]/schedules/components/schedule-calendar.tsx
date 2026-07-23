'use client'

import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { parseCronToHumanReadable } from '@/lib/schedules/utils'
import { cn } from '@/lib/utils'
import {
  bucketSchedulesByDay,
  type CalendarOccurrence,
  type CalendarScheduleItem,
  dateKey,
} from '@/app/arena/[workspaceId]/schedules/utils/calendar-occurrences'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_PILLS_PER_DAY = 3

interface ScheduleCalendarProps {
  schedules: CalendarScheduleItem[]
  onOpenWorkflow: (workflowId: string) => void
}

export function ScheduleCalendar({ schedules, onOpenWorkflow }: ScheduleCalendarProps) {
  const [anchor, setAnchor] = useState(() => new Date())

  const gridStart = useMemo(() => startOfWeek(startOfMonth(anchor)), [anchor])
  const gridEnd = useMemo(() => endOfWeek(endOfMonth(anchor)), [anchor])
  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd]
  )

  const eventsByDay = useMemo(
    () => bucketSchedulesByDay(schedules, gridStart, gridEnd),
    [schedules, gridStart, gridEnd]
  )

  const today = new Date()

  return (
    <div className='flex h-full min-w-0 flex-col'>
      {/* Toolbar */}
      <div className='flex flex-shrink-0 items-center justify-between gap-2 pb-3'>
        <div className='flex items-center gap-2'>
          <h2 className='font-semibold text-[14px] text-foreground'>
            {format(anchor, 'MMMM yyyy')}
          </h2>
        </div>
        <div className='flex items-center gap-1'>
          <Button
            variant='outline'
            size='sm'
            className='h-7 text-xs'
            onClick={() => setAnchor(today)}
          >
            Today
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            onClick={() => setAnchor((prev) => subMonths(prev, 1))}
            aria-label='Previous month'
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            onClick={() => setAnchor((prev) => addMonths(prev, 1))}
            aria-label='Next month'
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Weekday header */}
      <div className='grid flex-shrink-0 grid-cols-7 border-border/40 border-b'>
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className='px-2 py-1.5 text-center font-medium text-[11px] text-muted-foreground uppercase tracking-wide'
          >
            {label}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className='grid flex-1 auto-rows-fr grid-cols-7 overflow-hidden rounded-b-xl border border-border/50'>
        {days.map((day) => {
          const key = dateKey(day)
          const occurrences = eventsByDay.get(key) ?? []
          const visible = occurrences.slice(0, MAX_PILLS_PER_DAY)
          const overflowCount = occurrences.length - visible.length
          const inCurrentMonth = isSameMonth(day, anchor)
          const isCurrentDay = isToday(day)

          return (
            <div
              key={key}
              className={cn(
                'flex min-h-[92px] flex-col gap-1 border-border/30 border-t border-r p-1.5 last:border-r-0',
                !inCurrentMonth && 'bg-muted/20'
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px]',
                  isCurrentDay
                    ? 'bg-primary font-semibold text-primary-foreground'
                    : inCurrentMonth
                      ? 'text-foreground'
                      : 'text-muted-foreground/50'
                )}
              >
                {format(day, 'd')}
              </span>
              <div className='flex flex-col gap-0.5'>
                {visible.map((occurrence, idx) => (
                  <EventPill
                    key={`${occurrence.schedule.id}-${occurrence.time.getTime()}-${idx}`}
                    occurrence={occurrence}
                    onOpenWorkflow={onOpenWorkflow}
                  />
                ))}
                {overflowCount > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type='button'
                        className='truncate rounded px-1 py-0.5 text-left text-[10px] text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      >
                        +{overflowCount} more
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className='w-64 p-2' align='start'>
                      <p className='mb-2 px-1 font-medium text-[12px] text-foreground'>
                        {format(day, 'EEEE, MMMM d')}
                      </p>
                      <div className='flex max-h-64 flex-col gap-1 overflow-auto'>
                        {occurrences.map((occurrence, idx) => (
                          <EventPill
                            key={`${occurrence.schedule.id}-${occurrence.time.getTime()}-full-${idx}`}
                            occurrence={occurrence}
                            onOpenWorkflow={onOpenWorkflow}
                            expanded
                          />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EventPill({
  occurrence,
  onOpenWorkflow,
  expanded,
}: {
  occurrence: CalendarOccurrence
  onOpenWorkflow: (workflowId: string) => void
  expanded?: boolean
}) {
  const { schedule, time } = occurrence
  const isFailing = schedule.failedCount > 0
  const scheduleTiming = schedule.cronExpression
    ? parseCronToHumanReadable(schedule.cronExpression)
    : null

  return (
    <button
      type='button'
      onClick={() => onOpenWorkflow(schedule.workflowId)}
      title={[schedule.workflowName, scheduleTiming].filter(Boolean).join(' · ')}
      className={cn(
        'group flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[10px] transition-colors',
        isFailing
          ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
          : 'bg-primary/10 text-primary hover:bg-primary/20',
        expanded && 'text-[12px]'
      )}
    >
      <Clock className={cn('flex-shrink-0 opacity-70', expanded ? 'h-3 w-3' : 'h-2.5 w-2.5')} />
      <span className='flex-shrink-0 font-mono tabular-nums'>{format(time, 'HH:mm')}</span>
      <span className='truncate'>{schedule.workflowName || 'Untitled workflow'}</span>
      {isFailing && expanded && (
        <Badge variant='destructive' className='ml-auto h-4 flex-shrink-0 px-1 text-[9px]'>
          Failing
        </Badge>
      )}
    </button>
  )
}
