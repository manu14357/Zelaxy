'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createLogger } from '@/lib/logs/console/logger'
import { tableKeys } from '@/hooks/queries/tables'

const logger = createLogger('useTableEventStream')

const RECONNECT_BACKOFF_MS = [500, 1_000, 2_000, 5_000, 10_000]

interface UseTableEventStreamArgs {
  tableId: string | undefined
  workspaceId: string | undefined
  enabled?: boolean
}

/**
 * Subscribes to the table's SSE event stream and invalidates the React Query
 * row cache whenever a data-change event arrives.
 *
 * Reconnects with exponential backoff on transport error.
 */
export function useTableEventStream({
  tableId,
  workspaceId,
  enabled = true,
}: UseTableEventStreamArgs): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled || !tableId || !workspaceId) return

    let cancelled = false
    let eventSource: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let reconnectAttempt = 0

    const scheduleReconnect = (): void => {
      if (cancelled) return
      const idx = Math.min(reconnectAttempt, RECONNECT_BACKOFF_MS.length - 1)
      reconnectAttempt++
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        connect()
      }, RECONNECT_BACKOFF_MS[idx])
    }

    const connect = (): void => {
      if (cancelled) return
      const url = `/api/table/${tableId}/events/stream`
      try {
        eventSource = new EventSource(url)
      } catch (err) {
        logger.warn('Failed to open table event stream', { tableId, err })
        scheduleReconnect()
        return
      }

      eventSource.onopen = () => {
        reconnectAttempt = 0
        logger.info('Table event stream connected', { tableId })
      }

      eventSource.onmessage = () => {
        // Any message means data changed — invalidate row queries
        void queryClient.invalidateQueries({ queryKey: tableKeys.rowsRoot(tableId) })
      }

      eventSource.onerror = () => {
        if (cancelled) return
        eventSource?.close()
        eventSource = null
        scheduleReconnect()
      }
    }

    connect()

    return () => {
      cancelled = true
      if (reconnectTimer !== null) clearTimeout(reconnectTimer)
      eventSource?.close()
      eventSource = null
    }
  }, [enabled, tableId, workspaceId, queryClient])
}
