import { Cron } from 'croner'

export interface CalendarScheduleItem {
  id: string
  workflowId: string
  workflowName: string
  cronExpression: string | null
  nextRunAt: string | null
  status: 'active' | 'disabled'
  failedCount: number
  timezone: string
}

export interface CalendarOccurrence {
  schedule: CalendarScheduleItem
  time: Date
}

const MAX_OCCURRENCES_PER_SCHEDULE = 500

/**
 * Walks a cron expression forward from `rangeStart` collecting every fire time up to
 * `rangeEnd`. Bounded by MAX_OCCURRENCES_PER_SCHEDULE so a pathological expression
 * (e.g. every second) can't loop unbounded — croner has no native "until date" stop.
 */
function occurrencesInRange(
  cronExpression: string,
  timezone: string,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  let cron: Cron
  try {
    cron = new Cron(cronExpression, { timezone })
  } catch {
    return []
  }

  const results: Date[] = []
  let cursor: Date = rangeStart
  for (let i = 0; i < MAX_OCCURRENCES_PER_SCHEDULE; i++) {
    const next = cron.nextRun(cursor)
    if (!next || next > rangeEnd) break
    results.push(next)
    cursor = next
  }
  return results
}

function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Buckets every occurrence of every active schedule that falls within
 * [rangeStart, rangeEnd] by local calendar day. Disabled schedules are skipped —
 * they won't actually fire, and the API nulls out their nextRunAt on disable.
 */
export function bucketSchedulesByDay(
  schedules: CalendarScheduleItem[],
  rangeStart: Date,
  rangeEnd: Date
): Map<string, CalendarOccurrence[]> {
  const buckets = new Map<string, CalendarOccurrence[]>()

  const addOccurrence = (schedule: CalendarScheduleItem, time: Date) => {
    const key = dateKey(time)
    const existing = buckets.get(key)
    if (existing) {
      existing.push({ schedule, time })
    } else {
      buckets.set(key, [{ schedule, time }])
    }
  }

  for (const schedule of schedules) {
    if (schedule.status !== 'active') continue

    if (schedule.cronExpression) {
      const occurrences = occurrencesInRange(
        schedule.cronExpression,
        schedule.timezone || 'UTC',
        rangeStart,
        rangeEnd
      )
      for (const time of occurrences) addOccurrence(schedule, time)
    } else if (schedule.nextRunAt) {
      const time = new Date(schedule.nextRunAt)
      if (!Number.isNaN(time.getTime()) && time >= rangeStart && time <= rangeEnd) {
        addOccurrence(schedule, time)
      }
    }
  }

  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => a.time.getTime() - b.time.getTime())
  }

  return buckets
}

export { dateKey }
