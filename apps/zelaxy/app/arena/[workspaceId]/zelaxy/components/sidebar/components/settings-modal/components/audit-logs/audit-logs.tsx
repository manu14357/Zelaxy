'use client'

import { useCallback, useEffect, useState } from 'react'
import { Building2, ScrollText, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { createLogger } from '@/lib/logs/console/logger'
import { useOrganizationStore } from '@/stores/organization'
import { SettingPageHeader } from '../shared'

const logger = createLogger('AuditLogs')

const PAGE_SIZE = 25

interface AuditLogEntry {
  id: string
  userId: string
  organizationId: string
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

interface AuditLogsProps {
  onOpenChange?: (open: boolean) => void
}

function formatTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AuditLogs(_props: AuditLogsProps) {
  const { activeOrganization } = useOrganizationStore()
  const orgId = activeOrganization?.id

  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const fetchLogs = useCallback(
    async (nextOffset: number, append: boolean) => {
      if (!orgId) return
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/organizations/${orgId}/audit-logs?limit=${PAGE_SIZE}&offset=${nextOffset}`
        )
        if (res.status === 403) {
          setForbidden(true)
          setLogs([])
          return
        }
        if (!res.ok) throw new Error(`Failed to load audit logs (${res.status})`)
        const json = await res.json()
        const data = (json.data ?? []) as AuditLogEntry[]
        setForbidden(false)
        setLogs((prev) => (append ? [...prev, ...data] : data))
        setHasMore(json.pagination?.hasMore ?? false)
        setOffset(nextOffset)
      } catch (err) {
        logger.error('Error loading audit logs:', err)
        setError(err instanceof Error ? err.message : 'Failed to load audit logs')
      } finally {
        setIsLoading(false)
      }
    },
    [orgId]
  )

  useEffect(() => {
    if (orgId) fetchLogs(0, false)
  }, [orgId, fetchLogs])

  if (!orgId) {
    return (
      <div className='space-y-6 px-3 py-6'>
        <SettingPageHeader
          title='Audit Logs'
          description='A record of administrative actions taken in your organization.'
        />
        <div className='flex flex-col items-center justify-center gap-2 rounded-xl border border-border/60 border-dashed py-12 text-center'>
          <Building2 className='h-7 w-7 text-muted-foreground/60' />
          <p className='text-muted-foreground text-sm'>
            You need an organization to view audit logs.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6 px-3 py-6'>
      <SettingPageHeader
        title='Audit Logs'
        description='A record of administrative actions taken in your organization.'
        action={
          <Button
            variant='outline'
            size='sm'
            onClick={() => fetchLogs(0, false)}
            disabled={isLoading}
          >
            Refresh
          </Button>
        }
      />

      {forbidden ? (
        <div className='flex flex-col items-center justify-center gap-2 rounded-xl border border-border/60 border-dashed py-12 text-center'>
          <ShieldAlert className='h-7 w-7 text-muted-foreground/60' />
          <p className='text-muted-foreground text-sm'>
            Only organization owners and admins can view audit logs.
          </p>
        </div>
      ) : error ? (
        <div className='rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[13px] text-destructive'>
          {error}
        </div>
      ) : isLoading && logs.length === 0 ? (
        <div className='space-y-2'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className='h-12 w-full rounded-lg' />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-2 rounded-xl border border-border/60 border-dashed py-12 text-center'>
          <ScrollText className='h-7 w-7 text-muted-foreground/60' />
          <p className='text-muted-foreground text-sm'>No audit events recorded yet.</p>
        </div>
      ) : (
        <>
          <div className='overflow-hidden rounded-xl border border-border/60'>
            {logs.map((log) => (
              <div
                key={log.id}
                className='flex items-center gap-3 border-border/30 border-b px-4 py-2.5 text-sm last:border-b-0'
              >
                <Badge variant='outline' className='font-mono text-[10px]'>
                  {log.action}
                </Badge>
                <span className='truncate text-muted-foreground text-xs'>
                  {log.entityType}
                  {log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ''}
                </span>
                <span className='ml-auto flex-shrink-0 text-muted-foreground/70 text-xs'>
                  {log.ipAddress ? `${log.ipAddress} · ` : ''}
                  {formatTimestamp(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
          {hasMore && (
            <div className='flex justify-center'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => fetchLogs(offset + PAGE_SIZE, true)}
                disabled={isLoading}
              >
                {isLoading ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
