'use client'

/**
 * React Query hooks for managing user-defined tables.
 * Adapted from sim-main for Zelaxy's API surface.
 */

import { createLogger } from '@/lib/logs/console/logger'
import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  CsvHeaderMapping,
  Filter,
  RowData,
  Sort,
  TableDefinition,
  TableMetadata,
  TableRow,
} from '@/lib/table'

const logger = createLogger('TableQueries')

export const tableKeys = {
  all: ['tables'] as const,
  lists: () => [...tableKeys.all, 'list'] as const,
  list: (workspaceId?: string, scope = 'active') =>
    [...tableKeys.lists(), workspaceId ?? '', scope] as const,
  details: () => [...tableKeys.all, 'detail'] as const,
  detail: (tableId: string) => [...tableKeys.details(), tableId] as const,
  rowsRoot: (tableId: string) => [...tableKeys.detail(tableId), 'rows'] as const,
  infiniteRows: (tableId: string, paramsKey: string) =>
    [...tableKeys.rowsRoot(tableId), 'infinite', paramsKey] as const,
}

// ─── Response types ───────────────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface RowsPage {
  rows: TableRow[]
  totalCount: number
  hasMore: boolean
  nextOffset: number | null
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useTables(workspaceId: string | undefined, scope: 'active' | 'archived' | 'all' = 'active') {
  return useQuery({
    queryKey: tableKeys.list(workspaceId, scope),
    queryFn: async (): Promise<TableDefinition[]> => {
      if (!workspaceId) return []
      const res = await fetch(`/api/table?workspaceId=${encodeURIComponent(workspaceId)}&scope=${scope}`)
      if (!res.ok) throw new Error('Failed to load tables')
      const json: ApiResponse<{ tables: TableDefinition[] }> = await res.json()
      return json.data?.tables ?? []
    },
    enabled: !!workspaceId,
  })
}

export function useTable(tableId: string | undefined) {
  return useQuery({
    queryKey: tableKeys.detail(tableId ?? ''),
    queryFn: async (): Promise<TableDefinition> => {
      const res = await fetch(`/api/table/${tableId}`)
      if (!res.ok) throw new Error('Failed to load table')
      const json: ApiResponse<{ table: TableDefinition }> = await res.json()
      return json.data!.table
    },
    enabled: !!tableId,
  })
}

export function useInfiniteTableRows(
  tableId: string | undefined,
  opts: { filter?: Filter | null; sort?: Sort | null; pageSize?: number } = {}
) {
  const { filter, sort, pageSize = 100 } = opts
  const paramsKey = JSON.stringify({ filter, sort, pageSize })

  return useInfiniteQuery<RowsPage, Error>({
    queryKey: tableKeys.infiniteRows(tableId ?? '', paramsKey),
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }): Promise<RowsPage> => {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(pageParam as number),
      })
      if (sort) params.set('sort', JSON.stringify(sort))
      const res = await fetch(`/api/table/${tableId}/rows?${params}`)
      if (!res.ok) throw new Error('Failed to load rows')
      const json: ApiResponse<RowsPage> = await res.json()
      return json.data!
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!tableId,
  })
}

// ─── Table Mutations ──────────────────────────────────────────────────────────

export function useCreateTable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      description?: string | null
      workspaceId: string
      schema?: { columns: Array<{ name: string; type: string }> }
    }): Promise<TableDefinition> => {
      const res = await fetch('/api/table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to create table')
      }
      const json: ApiResponse<{ table: TableDefinition }> = await res.json()
      return json.data!.table
    },
    onSuccess: (table) => {
      queryClient.invalidateQueries({ queryKey: tableKeys.lists() })
      logger.info(`Created table ${table.id}`)
    },
    onError: (error) => {
      logger.error('Failed to create table:', error)
    },
  })
}

export function useDeleteTable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (tableId: string): Promise<void> => {
      const res = await fetch(`/api/table/${tableId}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to delete table')
      }
    },
    onSuccess: (_, tableId) => {
      queryClient.removeQueries({ queryKey: tableKeys.detail(tableId) })
      queryClient.invalidateQueries({ queryKey: tableKeys.lists() })
    },
    onError: (error) => {
      logger.error('Failed to delete table:', error)
    },
  })
}

export function useRenameTable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ tableId, name }: { tableId: string; name: string }): Promise<void> => {
      const res = await fetch(`/api/table/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to rename table')
      }
    },
    onSuccess: (_, { tableId }) => {
      queryClient.invalidateQueries({ queryKey: tableKeys.detail(tableId) })
      queryClient.invalidateQueries({ queryKey: tableKeys.lists() })
    },
    onError: (error) => {
      logger.error('Failed to rename table:', error)
    },
  })
}

// ─── Row Mutations ────────────────────────────────────────────────────────────

export function useCreateTableRow(tableId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      data: RowData
      workspaceId: string
      position?: number
    }): Promise<TableRow> => {
      const res = await fetch(`/api/table/${tableId}/rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to create row')
      }
      const json: ApiResponse<{ row: TableRow }> = await res.json()
      return json.data!.row
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.rowsRoot(tableId) })
      queryClient.invalidateQueries({ queryKey: tableKeys.detail(tableId) })
    },
  })
}

export function useBatchCreateTableRows(tableId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      rows: RowData[]
      workspaceId: string
      positions?: number[]
    }): Promise<{ rows: TableRow[]; insertedCount: number }> => {
      const res = await fetch(`/api/table/${tableId}/rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to create rows')
      }
      const json: ApiResponse<{ rows: TableRow[]; insertedCount: number }> = await res.json()
      return json.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.rowsRoot(tableId) })
      queryClient.invalidateQueries({ queryKey: tableKeys.detail(tableId) })
    },
  })
}

export function useUpdateTableRow(tableId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ rowId, data }: { rowId: string; data: RowData }): Promise<TableRow> => {
      const res = await fetch(`/api/table/${tableId}/rows/${rowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to update row')
      }
      const json: ApiResponse<{ row: TableRow }> = await res.json()
      return json.data!.row
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.rowsRoot(tableId) })
    },
  })
}

export function useBatchUpdateTableRows(tableId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates: Array<{ rowId: string; data: RowData }>): Promise<void> => {
      const res = await fetch(`/api/table/${tableId}/rows`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to update rows')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.rowsRoot(tableId) })
    },
  })
}

export function useDeleteTableRow(tableId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (rowId: string): Promise<void> => {
      const res = await fetch(`/api/table/${tableId}/rows/${rowId}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to delete row')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.rowsRoot(tableId) })
      queryClient.invalidateQueries({ queryKey: tableKeys.detail(tableId) })
    },
  })
}

export function useDeleteTableRows(tableId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (rowIds: string[]): Promise<{ deletedCount: number }> => {
      const res = await fetch(`/api/table/${tableId}/rows`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIds }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to delete rows')
      }
      const json: ApiResponse<{ deletedCount: number }> = await res.json()
      return json.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.rowsRoot(tableId) })
      queryClient.invalidateQueries({ queryKey: tableKeys.detail(tableId) })
    },
  })
}

// ─── Column Mutations ─────────────────────────────────────────────────────────

export function useAddTableColumn(tableId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (column: {
      name: string
      type: string
      required?: boolean
      unique?: boolean
    }): Promise<TableDefinition> => {
      const res = await fetch(`/api/table/${tableId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to add column')
      }
      const json: ApiResponse<{ table: TableDefinition }> = await res.json()
      return json.data!.table
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.detail(tableId) })
    },
  })
}

export function useUpdateColumn(tableId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      columnName,
      updates,
    }: {
      columnName: string
      updates: {
        name?: string
        type?: string
        required?: boolean
        unique?: boolean
      }
    }): Promise<TableDefinition> => {
      const res = await fetch(`/api/table/${tableId}/columns`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnName, updates }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to update column')
      }
      const json: ApiResponse<{ table: TableDefinition }> = await res.json()
      return json.data!.table
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.detail(tableId) })
    },
  })
}

export function useDeleteColumn(tableId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (columnName: string): Promise<TableDefinition> => {
      const res = await fetch(`/api/table/${tableId}/columns`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnName }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to delete column')
      }
      const json: ApiResponse<{ table: TableDefinition }> = await res.json()
      return json.data!.table
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.detail(tableId) })
      queryClient.invalidateQueries({ queryKey: tableKeys.rowsRoot(tableId) })
    },
  })
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export function useUpdateTableMetadata(tableId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (metadata: Partial<TableMetadata>): Promise<void> => {
      const res = await fetch(`/api/table/${tableId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to update metadata')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.detail(tableId) })
    },
  })
}

// ─── CSV Import ───────────────────────────────────────────────────────────────

export function useImportCsvIntoTable(tableId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      file,
      mode,
      mapping,
    }: {
      file: File
      mode: 'append' | 'replace'
      mapping: CsvHeaderMapping
    }): Promise<{ insertedCount: number; deletedCount: number }> => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', mode)
      formData.append('mapping', JSON.stringify(mapping))

      const res = await fetch(`/api/table/${tableId}/import`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to import CSV')
      }
      const json: ApiResponse<{ insertedCount: number; deletedCount: number }> = await res.json()
      return json.data!
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: tableKeys.rowsRoot(tableId) })
      queryClient.invalidateQueries({ queryKey: tableKeys.detail(tableId) })
      toast.success(`Imported ${result.insertedCount} rows`)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Flattens all pages from an infinite query into a single rows array.
 */
export function flattenInfiniteRows(data: InfiniteData<RowsPage> | undefined): TableRow[] {
  if (!data) return []
  return data.pages.flatMap((p) => p.rows)
}

/**
 * Gets the total row count from the first page.
 */
export function getTotalRowCount(data: InfiniteData<RowsPage> | undefined): number {
  return data?.pages[0]?.totalCount ?? 0
}

// ─── CSV Import / Export helpers ──────────────────────────────────────────

/**
 * Trigger a browser download of the table's CSV export.
 */
export async function downloadTableExport(tableId: string, tableName?: string): Promise<void> {
  const res = await fetch(`/api/table/${tableId}/export`)
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error((json as { error?: string }).error ?? 'Export failed')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${tableName ?? tableId}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Upload a CSV file to create a new table. `POST /api/table/import-csv`
 */
export function useUploadCsvToTable(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File): Promise<TableDefinition> => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('workspaceId', workspaceId)
      const res = await fetch('/api/table/import-csv', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? 'Upload failed')
      }
      const json: ApiResponse<{ table: TableDefinition }> = await res.json()
      return json.data!.table
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.list(workspaceId) })
      toast.success('Table created from CSV')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
