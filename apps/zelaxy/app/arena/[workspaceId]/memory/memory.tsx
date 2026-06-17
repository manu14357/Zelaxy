'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Brain, ChevronDown, ChevronRight, Database, RefreshCw, Trash2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { createLogger } from '@/lib/logs/console/logger'
import { useUserPermissionsContext } from '@/app/arena/[workspaceId]/providers/workspace-permissions-provider'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'

const logger = createLogger('MemoryBrowser')

interface MemoryRecord {
  id: string
  workflowId: string
  key: string
  type: string
  data: unknown
  createdAt: string
  updatedAt: string
}

function recordSize(record: MemoryRecord): number {
  return Array.isArray(record.data) ? record.data.length : record.data ? 1 : 0
}

export function Memory() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const userPermissions = useUserPermissionsContext()
  const canEdit = userPermissions.canEdit === true

  const { workflows } = useWorkflowRegistry()
  const workspaceWorkflows = useMemo(
    () =>
      Object.values(workflows)
        .filter((w) => w.workspaceId === workspaceId || !w.workspaceId)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [workflows, workspaceId]
  )

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('')
  const [records, setRecords] = useState<MemoryRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)

  // Default to the first workflow once the registry is populated
  useEffect(() => {
    if (!selectedWorkflowId && workspaceWorkflows.length > 0) {
      setSelectedWorkflowId(workspaceWorkflows[0].id)
    }
  }, [workspaceWorkflows, selectedWorkflowId])

  const fetchMemories = useCallback(async () => {
    if (!selectedWorkflowId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/memory?workflowId=${encodeURIComponent(selectedWorkflowId)}&limit=200`
      )
      if (!res.ok) throw new Error(`Failed to load memory (${res.status})`)
      const json = await res.json()
      setRecords(json.data?.memories ?? [])
      setExpanded(new Set())
    } catch (err) {
      logger.error('Error loading memory:', err)
      setError(err instanceof Error ? err.message : 'Failed to load memory')
    } finally {
      setIsLoading(false)
    }
  }, [selectedWorkflowId])

  useEffect(() => {
    fetchMemories()
  }, [fetchMemories])

  const deleteRecord = useCallback(async (record: MemoryRecord) => {
    setBusyId(record.id)
    try {
      const res = await fetch(
        `/api/memory/${record.id}?workflowId=${encodeURIComponent(record.workflowId)}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error(`Failed to delete memory (${res.status})`)
      setRecords((prev) => prev.filter((r) => r.id !== record.id))
    } catch (err) {
      logger.error('Error deleting memory:', err)
    } finally {
      setBusyId(null)
    }
  }, [])

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return (
    <div className='flex h-full min-w-0 flex-col bg-background'>
      {/* Header */}
      <div className='flex-shrink-0 border-border/40 border-b bg-card/30 px-4 py-4 sm:px-6'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-3'>
            <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
              <Brain className='h-4 w-4 text-primary' />
            </div>
            <div>
              <h1 className='font-semibold text-[15px] text-foreground leading-none'>Memory</h1>
              <p className='mt-1 hidden text-[12px] text-muted-foreground sm:block'>
                Inspect and manage stored memory for your workflows
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Select value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
              <SelectTrigger className='h-8 w-[180px] text-xs sm:w-[220px]'>
                <SelectValue placeholder='Select a workflow' />
              </SelectTrigger>
              <SelectContent>
                {workspaceWorkflows.map((w) => (
                  <SelectItem key={w.id} value={w.id} className='text-xs'>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              onClick={fetchMemories}
              disabled={isLoading || !selectedWorkflowId}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-auto px-4 py-4 sm:px-6'>
        {workspaceWorkflows.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-2 py-16 text-center'>
            <Database className='h-8 w-8 text-muted-foreground/60' />
            <p className='text-muted-foreground text-sm'>No workflows in this workspace yet.</p>
          </div>
        ) : isLoading ? (
          <div className='space-y-2'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-12 w-full rounded-lg' />
            ))}
          </div>
        ) : error ? (
          <div className='flex flex-col items-center justify-center gap-2 py-16 text-center'>
            <p className='text-muted-foreground text-sm'>{error}</p>
            <Button variant='outline' size='sm' onClick={fetchMemories}>
              Try again
            </Button>
          </div>
        ) : records.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-2 py-16 text-center'>
            <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50'>
              <Brain className='h-6 w-6 text-muted-foreground' />
            </div>
            <p className='font-medium text-foreground text-sm'>No memory records</p>
            <p className='max-w-sm text-muted-foreground text-xs'>
              This workflow hasn't stored any memory yet. Memory blocks write records here at
              runtime.
            </p>
          </div>
        ) : (
          <div className='overflow-hidden rounded-xl border border-border/50'>
            {records.map((record) => {
              const isOpen = expanded.has(record.id)
              return (
                <div key={record.id} className='border-border/30 border-b last:border-b-0'>
                  <div className='flex items-center gap-3 px-4 py-3 hover:bg-muted/20'>
                    <button
                      type='button'
                      onClick={() => toggleExpand(record.id)}
                      className='flex min-w-0 flex-1 items-center gap-2 text-left'
                    >
                      {isOpen ? (
                        <ChevronDown className='h-3.5 w-3.5 flex-shrink-0 text-muted-foreground' />
                      ) : (
                        <ChevronRight className='h-3.5 w-3.5 flex-shrink-0 text-muted-foreground' />
                      )}
                      <span className='truncate font-medium font-mono text-foreground text-sm'>
                        {record.key}
                      </span>
                      <Badge variant='outline' className='text-[10px] capitalize'>
                        {record.type}
                      </Badge>
                      <Badge variant='secondary' className='text-[10px]'>
                        {recordSize(record)} item{recordSize(record) === 1 ? '' : 's'}
                      </Badge>
                    </button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-7 w-7 text-muted-foreground hover:text-destructive'
                      disabled={!canEdit || busyId === record.id}
                      onClick={() => deleteRecord(record)}
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                    </Button>
                  </div>
                  {isOpen && (
                    <pre className='max-h-80 overflow-auto border-border/30 border-t bg-muted/30 px-4 py-3 text-[11px] text-muted-foreground'>
                      {JSON.stringify(record.data, null, 2)}
                    </pre>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Memory
