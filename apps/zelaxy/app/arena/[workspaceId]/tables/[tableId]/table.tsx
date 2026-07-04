'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Download, Filter, Upload } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { clearLastOpened, getLastOpened, rememberLastOpened } from '@/lib/arena/last-opened'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { Filter as FilterType, TableRow } from '@/lib/table'
import { cn } from '@/lib/utils'
import { useUserPermissionsContext } from '@/app/arena/[workspaceId]/providers/workspace-permissions-provider'
import { downloadTableExport, useDeleteTable, useRenameTable } from '@/hooks/queries/tables'
import { useInlineRename } from '@/hooks/use-inline-rename'
import type { DeletedRowSnapshot } from '@/stores/table/types'
import { ImportCsvDialog } from '../components/import-csv-dialog'
import {
  ColumnConfigSidebar,
  NewColumnDropdown,
  RowModal,
  TableFilter,
  TableGrid,
} from './components'
import type { ColumnConfig } from './components/column-config-sidebar'
import { useTable } from './hooks/use-table'
import { useTableEventStream } from './hooks/use-table-event-stream'
import type { QueryOptions } from './types'

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMN_SIDEBAR_WIDTH = 400

// ─── State types ─────────────────────────────────────────────────────────────

type SlideoutState = { kind: 'none' } | { kind: 'column'; config: ColumnConfig }

type RowModalState =
  | { kind: 'none' }
  | { kind: 'add' }
  | { kind: 'edit'; row: TableRow }
  | { kind: 'delete'; row?: TableRow; rowIds?: string[] }

// ─── Component ────────────────────────────────────────────────────────────────

export function Table({
  tableId: tableIdProp,
  workspaceId: workspaceIdProp,
}: {
  tableId?: string
  workspaceId?: string
} = {}) {
  const params = useParams()
  const router = useRouter()
  // Allow embedding outside the /tables/[tableId] route (e.g. the ZelaxyArena live panel) by passing
  // ids explicitly; otherwise fall back to the route params.
  const workspaceId = workspaceIdProp ?? (params.workspaceId as string)
  const tableId = tableIdProp ?? (params.tableId as string)

  // True only on the real /tables/[tableId] route — not when embedded (e.g. the ZelaxyArena live
  // panel passes ids as props). Resume tracking + the back-to-list control apply to the route only.
  const isRouteView = tableIdProp === undefined && workspaceIdProp === undefined

  // Remember this as the workspace's last-opened table so the Tables nav resumes here.
  useEffect(() => {
    if (isRouteView) rememberLastOpened(workspaceId, 'table', tableId)
  }, [isRouteView, workspaceId, tableId])

  const userPermissions = useUserPermissionsContext()

  // Query options (filter + sort)
  const [queryOptions, setQueryOptions] = useState<QueryOptions>({ filter: null, sort: null })
  const [showFilter, setShowFilter] = useState(false)

  // Table data
  const { tableData, columns } = useTable({ tableId, queryOptions })

  // Event stream (real-time updates)
  useTableEventStream({ tableId, workspaceId })

  // Rename
  const renameTableMutation = useRenameTable()
  const { editingId, editValue, setEditValue, startRename, submitRename, cancelRename } =
    useInlineRename({
      onSave: async (_id: string, newName: string) => {
        try {
          await renameTableMutation.mutateAsync({ tableId, name: newName })
        } catch (err) {
          toast.error('Failed to rename table')
        }
      },
    })
  const isRenamingTable = editingId === tableId

  // Delete table
  const deleteTableMutation = useDeleteTable()
  const [showDeleteTableDialog, setShowDeleteTableDialog] = useState(false)

  // Slideout (column config sidebar)
  const [slideoutState, setSlideoutState] = useState<SlideoutState>({ kind: 'none' })
  const isColumnSidebarOpen = slideoutState.kind === 'column'
  const sidebarReservedPx = isColumnSidebarOpen ? COLUMN_SIDEBAR_WIDTH : 0

  // Row modal
  const [rowModalState, setRowModalState] = useState<RowModalState>({ kind: 'none' })

  // Import CSV dialog
  const [showImportDialog, setShowImportDialog] = useState(false)

  // Delete columns dialog
  const [pendingDeleteColumns, setPendingDeleteColumns] = useState<string[]>([])

  // Sink refs for TableGrid callbacks
  const columnRenameSinkRef = useRef<((oldName: string, newName: string) => void) | null>(null)
  const afterDeleteRowsSinkRef = useRef<((snapshots: DeletedRowSnapshot[]) => void) | null>(null)
  const confirmDeleteColumnsSinkRef = useRef<((names: string[]) => void) | null>(null)
  const pushTableRenameUndoSinkRef = useRef<
    ((previousName: string, newName: string) => void) | null
  >(null)

  // ── Callbacks ──────────────────────────────────────────────────────────────

  const handleOpenColumnConfig = useCallback((cfg: ColumnConfig) => {
    setSlideoutState({ kind: 'column', config: cfg })
  }, [])

  const handleCloseColumnSidebar = useCallback(() => {
    setSlideoutState({ kind: 'none' })
  }, [])

  const handleOpenRowModal = useCallback((row: TableRow) => {
    setRowModalState({ kind: 'edit', row })
  }, [])

  const handleRequestDeleteRows = useCallback((snapshots: DeletedRowSnapshot[]) => {
    if (snapshots.length === 1) {
      setRowModalState({ kind: 'delete', rowIds: [snapshots[0].rowId] })
    } else {
      setRowModalState({ kind: 'delete', rowIds: snapshots.map((s) => s.rowId) })
    }
  }, [])

  const handleRequestDeleteColumns = useCallback((names: string[]) => {
    setPendingDeleteColumns(names)
  }, [])

  const handleNewColumnType = useCallback(
    (type: import('@/lib/table').ColumnDefinition['type']) => {
      const existingNames = columns.map((c) => c.name)
      let proposedName = 'Column'
      let idx = 1
      while (existingNames.includes(proposedName)) {
        proposedName = `Column ${idx++}`
      }
      setSlideoutState({
        kind: 'column',
        config: { mode: 'create', proposedName, type },
      })
    },
    [columns]
  )

  const handleApplyFilter = useCallback((filter: FilterType | null) => {
    setQueryOptions((prev) => ({ ...prev, filter }))
  }, [])

  const handleDeleteTable = useCallback(async () => {
    try {
      await deleteTableMutation.mutateAsync(tableId)
      // Don't let the Tables nav resume a table that no longer exists.
      if (getLastOpened(workspaceId, 'table') === tableId) clearLastOpened(workspaceId, 'table')
      router.push(`/arena/${workspaceId}/tables`)
    } catch (err) {
      toast.error('Failed to delete table')
    }
  }, [deleteTableMutation, tableId, router, workspaceId])

  const handleConfirmDeleteColumns = useCallback(() => {
    if (confirmDeleteColumnsSinkRef.current) {
      confirmDeleteColumnsSinkRef.current(pendingDeleteColumns)
    }
    setPendingDeleteColumns([])
  }, [pendingDeleteColumns])

  const handleColumnRename = useCallback((oldName: string, newName: string) => {
    if (columnRenameSinkRef.current) {
      columnRenameSinkRef.current(oldName, newName)
    }
  }, [])

  const handleExportCsv = useCallback(async () => {
    try {
      await downloadTableExport(tableId, tableData?.name)
    } catch {
      toast.error('Failed to export table')
    }
  }, [tableId, tableData?.name])

  // ── Render ─────────────────────────────────────────────────────────────────

  const tableName = tableData?.name ?? ''

  return (
    <div className='relative flex h-full w-full flex-col overflow-hidden'>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className='flex shrink-0 items-center gap-2 border-border border-b px-4 py-2'>
        {/* Back to the tables list. Only on the real route — resuming the last table via the nav
            would otherwise leave no way back to the grid (the header has no other list link). */}
        {isRouteView && (
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground'
            onClick={() => router.push(`/arena/${workspaceId}/tables`)}
            title='All tables'
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
        )}
        {/* Table name (inline rename) */}
        <div className='min-w-0 flex-1'>
          {isRenamingTable ? (
            <Input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={submitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRename()
                if (e.key === 'Escape') cancelRename()
              }}
              className='h-7 max-w-[240px] px-2 py-0.5 font-semibold text-sm'
            />
          ) : (
            <button
              className='truncate rounded px-1 py-0.5 font-semibold text-foreground text-sm hover:bg-muted'
              onClick={() => startRename(tableId, tableName)}
              disabled={!userPermissions.canEdit}
              title={userPermissions.canEdit ? 'Click to rename' : tableName}
            >
              {tableName}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className='flex shrink-0 items-center gap-1'>
          {/* Filter toggle */}
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setShowFilter((v) => !v)}
            className={cn('gap-1.5', showFilter && 'bg-muted text-foreground')}
          >
            <Filter className='size-3.5' />
            Filter
          </Button>

          {/* Import */}
          {userPermissions.canEdit && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowImportDialog(true)}
              className='gap-1.5'
            >
              <Upload className='size-3.5' />
              Import
            </Button>
          )}

          {/* Export */}
          <Button variant='ghost' size='sm' onClick={handleExportCsv} className='gap-1.5'>
            <Download className='size-3.5' />
            Export
          </Button>

          {/* Add Column */}
          {userPermissions.canEdit && (
            <NewColumnDropdown trigger='header' disabled={false} onPickType={handleNewColumnType} />
          )}

          {/* Delete table */}
          {userPermissions.canEdit && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowDeleteTableDialog(true)}
              className='text-destructive hover:bg-destructive/10 hover:text-destructive'
            >
              Delete table
            </Button>
          )}
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      {showFilter && (
        <TableFilter
          columns={columns.map((c) => ({ name: c.name, type: c.type }))}
          filter={queryOptions.filter}
          onApply={handleApplyFilter}
          onClose={() => setShowFilter(false)}
        />
      )}

      {/* ── Main content area ────────────────────────────────────────────── */}
      <div className='relative flex min-h-0 flex-1 overflow-hidden'>
        <TableGrid
          tableId={tableId}
          workspaceId={workspaceId}
          sidebarReservedPx={sidebarReservedPx}
          queryOptions={queryOptions}
          onOpenColumnConfig={handleOpenColumnConfig}
          onOpenRowModal={handleOpenRowModal}
          onRequestDeleteRows={handleRequestDeleteRows}
          onRequestDeleteColumns={handleRequestDeleteColumns}
          columnRenameSinkRef={columnRenameSinkRef}
          afterDeleteRowsSinkRef={afterDeleteRowsSinkRef}
          confirmDeleteColumnsSinkRef={confirmDeleteColumnsSinkRef}
          pushTableRenameUndoSinkRef={pushTableRenameUndoSinkRef}
        />

        {/* ── Column config sidebar ──────────────────────────────────────── */}
        <ColumnConfigSidebar
          config={slideoutState.kind === 'column' ? slideoutState.config : null}
          onClose={handleCloseColumnSidebar}
          existingColumn={
            slideoutState.kind === 'column' && slideoutState.config.mode === 'edit'
              ? (columns.find(
                  (c) =>
                    c.name ===
                    (slideoutState.config as { mode: 'edit'; columnName: string }).columnName
                ) ?? null)
              : null
          }
          tableId={tableId}
          onColumnRename={handleColumnRename}
        />
      </div>

      {/* ── Row modal ───────────────────────────────────────────────────── */}
      {tableData && rowModalState.kind !== 'none' && (
        <RowModal
          mode={
            rowModalState.kind === 'add' ? 'add' : rowModalState.kind === 'edit' ? 'edit' : 'delete'
          }
          isOpen={true}
          onClose={() => setRowModalState({ kind: 'none' })}
          table={tableData}
          row={rowModalState.kind === 'edit' ? rowModalState.row : undefined}
          rowIds={rowModalState.kind === 'delete' ? rowModalState.rowIds : undefined}
          onSuccess={() => {
            setRowModalState({ kind: 'none' })
          }}
        />
      )}

      {/* ── Import CSV dialog ────────────────────────────────────────────── */}
      {tableData && (
        <ImportCsvDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          workspaceId={workspaceId}
          table={tableData}
          onImported={() => {
            setShowImportDialog(false)
          }}
        />
      )}

      {/* ── Delete table confirmation ────────────────────────────────────── */}
      <Dialog open={showDeleteTableDialog} onOpenChange={setShowDeleteTableDialog}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Delete table</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className='font-semibold'>{tableName}</span>?
              This will permanently delete all data in this table and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowDeleteTableDialog(false)}
              disabled={deleteTableMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDeleteTable}
              disabled={deleteTableMutation.isPending}
            >
              {deleteTableMutation.isPending ? 'Deleting...' : 'Delete table'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete columns confirmation ──────────────────────────────────── */}
      <Dialog
        open={pendingDeleteColumns.length > 0}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteColumns([])
        }}
      >
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>
              Delete {pendingDeleteColumns.length === 1 ? 'column' : 'columns'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              {pendingDeleteColumns.length === 1 ? (
                <>
                  column <span className='font-semibold'>{pendingDeleteColumns[0]}</span>
                </>
              ) : (
                <>{pendingDeleteColumns.length} columns</>
              )}
              ? This will permanently remove all data in{' '}
              {pendingDeleteColumns.length === 1 ? 'this column' : 'these columns'} and cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setPendingDeleteColumns([])}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleConfirmDeleteColumns}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
