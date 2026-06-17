'use client'

import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { createLogger } from '@/lib/logs/console/logger'
import type {
  ColumnDefinition,
  RowData,
  TableDefinition,
  TableRow as TableRowType,
} from '@/lib/table'
import { TABLE_LIMITS } from '@/lib/table/index'
import { cn } from '@/lib/utils'
import { useUserPermissionsContext } from '@/app/arena/[workspaceId]/providers/workspace-permissions-provider'
import {
  useAddTableColumn,
  useBatchCreateTableRows,
  useBatchUpdateTableRows,
  useCreateTableRow,
  useDeleteColumn,
  useUpdateColumn,
  useUpdateTableMetadata,
  useUpdateTableRow,
} from '@/hooks/queries/tables'
import { useInlineRename } from '@/hooks/use-inline-rename'
import { useTableUndo } from '@/hooks/use-table-undo'

function extractCreatedRowId(response: Record<string, unknown>): string | undefined {
  const data = response?.data as Record<string, unknown> | undefined
  const row = data?.row as Record<string, unknown> | undefined
  return row?.id as string | undefined
}

import type { DeletedRowSnapshot } from '@/stores/table/types'
import { useContextMenu, useTable } from '../../hooks'
import type { EditingCell, QueryOptions, SaveReason } from '../../types'
import { cleanCellValue, storageToDisplay } from '../../utils'
import type { ColumnConfig } from '../column-config-sidebar'
import { ContextMenu } from '../context-menu'
import { NewColumnDropdown } from '../new-column-dropdown'
import { ExpandedCellPopover } from './cells'
import { ADD_COL_WIDTH, CELL_HEADER_CHECKBOX, COL_WIDTH, SELECTION_TINT_BG } from './constants'
import { DataRow } from './data-row'
import { ColumnHeaderMenu } from './headers'
import {
  AddRowButton,
  SelectAllCheckbox,
  TableBodySkeleton,
  TableColGroup,
} from './table-primitives'
import type { DisplayColumn } from './types'
import {
  type CellCoord,
  checkboxColLayout,
  collectRowSnapshots,
  computeNormalizedSelection,
  expandToDisplayColumns,
  moveCell,
  ROW_SELECTION_ALL,
  ROW_SELECTION_NONE,
  type RowSelection,
  rowSelectionCoversAll,
  rowSelectionIncludes,
  rowSelectionIsEmpty,
  rowSelectionMaterialize,
} from './utils'

const logger = createLogger('TableGrid')

const COL_WIDTH_MIN = 80
const COL_WIDTH_AUTO_FIT_MAX = 1000
const SKELETON_COL_COUNT = 4
const ROW_HEIGHT_ESTIMATE = 35

const CELL_HEADER =
  'border-border border-r border-b bg-background px-2 py-[7px] text-left align-middle'

/** Serialize a cell value for clipboard. */
function cellToText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

async function chunkBatchUpdates(
  updates: Array<{ rowId: string; data: RowData }>,
  mutateAsync: (args: Array<{ rowId: string; data: RowData }>) => Promise<unknown>
): Promise<void> {
  const size = TABLE_LIMITS.MAX_BULK_OPERATION_SIZE
  const chunks: Array<Array<{ rowId: string; data: RowData }>> = []
  for (let i = 0; i < updates.length; i += size) {
    chunks.push(updates.slice(i, i + size))
  }
  let cursor = 0
  let failed = false
  await Promise.all(
    Array.from({ length: Math.min(3, chunks.length) }, async () => {
      while (cursor < chunks.length && !failed) {
        const chunk = chunks[cursor++]!
        try {
          await mutateAsync(chunk)
        } catch (error) {
          failed = true
          throw error
        }
      }
    })
  )
}

export interface TableGridProps {
  workspaceId?: string
  tableId?: string
  embedded?: boolean
  sidebarReservedPx: number
  onOpenColumnConfig: (cfg: ColumnConfig) => void
  onOpenRowModal: (row: TableRowType) => void
  onRequestDeleteRows: (snapshots: DeletedRowSnapshot[]) => void
  onRequestDeleteColumns: (names: string[]) => void
  queryOptions: QueryOptions
  columnRenameSinkRef: React.MutableRefObject<((oldName: string, newName: string) => void) | null>
  afterDeleteRowsSinkRef: React.MutableRefObject<((snapshots: DeletedRowSnapshot[]) => void) | null>
  confirmDeleteColumnsSinkRef: React.MutableRefObject<((names: string[]) => void) | null>
  pushTableRenameUndoSinkRef: React.MutableRefObject<
    ((previousName: string, newName: string) => void) | null
  >
}

export function TableGrid({
  workspaceId: propWorkspaceId,
  tableId: propTableId,
  embedded,
  sidebarReservedPx,
  onOpenColumnConfig,
  onOpenRowModal,
  onRequestDeleteRows,
  onRequestDeleteColumns,
  queryOptions,
  columnRenameSinkRef,
  afterDeleteRowsSinkRef,
  confirmDeleteColumnsSinkRef,
  pushTableRenameUndoSinkRef,
}: TableGridProps) {
  const params = useParams()
  const workspaceId = propWorkspaceId || (params.workspaceId as string)
  const tableId = propTableId || (params.tableId as string)

  const userPermissions = useUserPermissionsContext()
  const canEditRef = useRef(userPermissions.canEdit)
  canEditRef.current = userPermissions.canEdit

  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [initialCharacter, setInitialCharacter] = useState<string | null>(null)
  const [expandedCell, setExpandedCell] = useState<EditingCell | null>(null)
  const [selectionAnchor, setSelectionAnchor] = useState<CellCoord | null>(null)
  const [selectionFocus, setSelectionFocus] = useState<CellCoord | null>(null)
  const [rowSelection, setRowSelection] = useState<RowSelection>(ROW_SELECTION_NONE)
  const [isColumnSelection, setIsColumnSelection] = useState(false)
  const lastCheckboxRowRef = useRef<string | null>(null)
  const isColumnSelectionRef = useRef(false)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const columnWidthsRef = useRef(columnWidths)
  columnWidthsRef.current = columnWidths
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [columnOrder, setColumnOrder] = useState<string[] | null>(null)
  const columnOrderRef = useRef(columnOrder)
  columnOrderRef.current = columnOrder
  const [dragColumnName, setDragColumnName] = useState<string | null>(null)
  const dragColumnNameRef = useRef(dragColumnName)
  dragColumnNameRef.current = dragColumnName
  const [dropTargetColumnName, setDropTargetColumnName] = useState<string | null>(null)
  const dropTargetColumnNameRef = useRef(dropTargetColumnName)
  dropTargetColumnNameRef.current = dropTargetColumnName
  const [dropSide, setDropSide] = useState<'left' | 'right'>('left')
  const dropSideRef = useRef(dropSide)
  dropSideRef.current = dropSide
  const metadataSeededRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const theadRef = useRef<HTMLTableSectionElement>(null)
  const tbodyRef = useRef<HTMLTableSectionElement>(null)
  const isDraggingRef = useRef(false)
  const suppressFocusScrollRef = useRef(false)

  const {
    tableData,
    isLoadingTable,
    rows,
    isLoadingRows,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    columns,
    ensureAllRowsLoaded,
  } = useTable({ tableId, queryOptions })

  const tableRowCountRef = useRef(tableData?.rowCount ?? 0)
  tableRowCountRef.current = tableData?.rowCount ?? 0

  const fetchNextPageRef = useRef(fetchNextPage)
  fetchNextPageRef.current = fetchNextPage
  const hasNextPageRef = useRef(hasNextPage)
  hasNextPageRef.current = hasNextPage
  const isFetchingNextPageRef = useRef(isFetchingNextPage)
  isFetchingNextPageRef.current = isFetchingNextPage
  const ensureAllRowsLoadedRef = useRef(ensureAllRowsLoaded)
  ensureAllRowsLoadedRef.current = ensureAllRowsLoaded
  const isAppendingRowRef = useRef(false)

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    overscan: 10,
    scrollMargin: theadRef.current?.offsetHeight ?? 0,
  })

  const {
    contextMenu,
    handleRowContextMenu: baseHandleRowContextMenu,
    closeContextMenu,
  } = useContextMenu()

  const updateRowMutation = useUpdateTableRow(tableId)
  const createRowMutation = useCreateTableRow(tableId)
  const batchCreateRowsMutation = useBatchCreateTableRows(tableId)
  const batchUpdateRowsMutation = useBatchUpdateTableRows(tableId)
  const addColumnMutation = useAddTableColumn(tableId)
  const updateColumnMutation = useUpdateColumn(tableId)
  const deleteColumnMutation = useDeleteColumn(tableId)
  const updateMetadataMutation = useUpdateTableMetadata(tableId)

  function handleColumnOrderChange(order: string[]) {
    setColumnOrder(order)
  }

  function handleColumnRename(oldName: string, newName: string) {
    let updatedWidths = columnWidthsRef.current
    let widthsChanged = false
    const nextWidths: Record<string, number> = {}
    for (const [key, width] of Object.entries(updatedWidths)) {
      if (key === oldName) {
        nextWidths[newName] = width
        widthsChanged = true
      } else {
        nextWidths[key] = width
      }
    }
    if (widthsChanged) {
      updatedWidths = nextWidths
      setColumnWidths(updatedWidths)
    }
    const updatedOrder = columnOrderRef.current?.map((n) => (n === oldName ? newName : n))
    if (updatedOrder) setColumnOrder(updatedOrder)
    updateMetadataRef.current({
      columnWidths: updatedWidths,
      ...(updatedOrder ? { columnOrder: updatedOrder } : {}),
    })
  }
  columnRenameSinkRef.current = handleColumnRename

  function getColumnWidths() {
    return columnWidthsRef.current
  }

  function handleColumnWidthsChange(widths: Record<string, number>) {
    setColumnWidths(widths)
  }

  const { pushUndo, undo, redo } = useTableUndo({
    workspaceId,
    tableId,
    onColumnOrderChange: handleColumnOrderChange,
    onColumnRename: handleColumnRename,
    onColumnWidthsChange: handleColumnWidthsChange,
    getColumnWidths,
  })
  const undoRef = useRef(undo)
  undoRef.current = undo
  const redoRef = useRef(redo)
  redoRef.current = redo
  const pushUndoRef = useRef(pushUndo)
  pushUndoRef.current = pushUndo

  const displayColumns = useMemo<DisplayColumn[]>(() => {
    let ordered: ColumnDefinition[]
    if (!columnOrder || columnOrder.length === 0) {
      ordered = columns
    } else {
      const colMap = new Map(columns.map((c) => [c.name, c]))
      ordered = []
      for (const name of columnOrder) {
        const col = colMap.get(name)
        if (col) {
          ordered.push(col)
          colMap.delete(name)
        }
      }
      for (const col of colMap.values()) {
        ordered.push(col)
      }
    }
    return expandToDisplayColumns(ordered)
  }, [columns, columnOrder])

  const { colWidth: checkboxColWidth, numDivWidth } = checkboxColLayout(tableData?.maxRows ?? 0)

  const normalizedSelection = useMemo(
    () => computeNormalizedSelection(selectionAnchor, selectionFocus),
    [selectionAnchor, selectionFocus]
  )

  const displayColCount = isLoadingTable ? SKELETON_COL_COUNT : displayColumns.length
  const tableWidth = useMemo(() => {
    const colsWidth = isLoadingTable
      ? displayColCount * COL_WIDTH
      : displayColumns.reduce((sum, col) => sum + (columnWidths[col.key] ?? COL_WIDTH), 0)
    return checkboxColWidth + colsWidth + ADD_COL_WIDTH
  }, [isLoadingTable, displayColCount, displayColumns, columnWidths, checkboxColWidth])

  const resizeIndicatorLeft = useMemo(() => {
    if (!resizingColumn) return 0
    let left = checkboxColWidth
    for (const col of displayColumns) {
      left += columnWidths[col.key] ?? COL_WIDTH
      if (col.key === resizingColumn) return left
    }
    return 0
  }, [resizingColumn, displayColumns, columnWidths, checkboxColWidth])

  const dropColumnBounds = useMemo(() => {
    if (!dropTargetColumnName || !dragColumnName) return null
    if (dropTargetColumnName === dragColumnName) return null
    const cols = displayColumns
    const targetIdx = cols.findIndex((c) => c.name === dropTargetColumnName)
    if (targetIdx === -1) return null
    let left = checkboxColWidth
    for (let i = 0; i < cols.length; i++) {
      const w = columnWidths[cols[i].key] ?? COL_WIDTH
      if (i === targetIdx) {
        const lineLeft = dropSide === 'left' ? left : left + w
        return { left, width: w, lineLeft }
      }
      left += w
    }
    return null
  }, [
    dropTargetColumnName,
    dragColumnName,
    dropSide,
    displayColumns,
    columnWidths,
    checkboxColWidth,
  ])

  const isAllRowsSelected = useMemo(
    () => rowSelectionCoversAll(rowSelection, rows),
    [rowSelection, rows]
  )
  const isAllRowsSelectedRef = useRef(isAllRowsSelected)
  isAllRowsSelectedRef.current = isAllRowsSelected

  const columnsRef = useRef(displayColumns)
  const schemaColumnsRef = useRef(columns)
  const rowsRef = useRef(rows)
  const selectionAnchorRef = useRef(selectionAnchor)
  const selectionFocusRef = useRef(selectionFocus)
  const anchorRowIdRef = useRef<string | null>(null)
  const focusRowIdRef = useRef<string | null>(null)
  const rowSelectionRef = useRef(rowSelection)
  rowSelectionRef.current = rowSelection

  columnsRef.current = displayColumns
  schemaColumnsRef.current = columns
  rowsRef.current = rows
  selectionAnchorRef.current = selectionAnchor
  selectionFocusRef.current = selectionFocus
  isColumnSelectionRef.current = isColumnSelection
  anchorRowIdRef.current = selectionAnchor
    ? (rowsRef.current[selectionAnchor.rowIndex]?.id ?? null)
    : null
  focusRowIdRef.current = selectionFocus
    ? (rowsRef.current[selectionFocus.rowIndex]?.id ?? null)
    : null

  const mutateRef = useRef(updateRowMutation.mutate)
  mutateRef.current = updateRowMutation.mutate
  const createRef = useRef(createRowMutation.mutate)
  createRef.current = createRowMutation.mutate
  const batchCreateRef = useRef(batchCreateRowsMutation.mutate)
  batchCreateRef.current = batchCreateRowsMutation.mutate
  const batchUpdateRef = useRef(batchUpdateRowsMutation.mutate)
  batchUpdateRef.current = batchUpdateRowsMutation.mutate
  const batchUpdateAsyncRef = useRef(batchUpdateRowsMutation.mutateAsync)
  batchUpdateAsyncRef.current = batchUpdateRowsMutation.mutateAsync
  const updateMetadataRef = useRef(updateMetadataMutation.mutate)
  updateMetadataRef.current = updateMetadataMutation.mutate

  const editingCellRef = useRef(editingCell)
  editingCellRef.current = editingCell

  const [pendingUpdate, setPendingUpdate] = useState<{
    rowId: string
    data: Record<string, unknown>
  } | null>(null)

  const columnRename = useInlineRename({
    onSave: (columnName, newName) => {
      pushUndoRef.current({ type: 'rename-column', oldName: columnName, newName })
      handleColumnRename(columnName, newName)
      updateColumnMutation.mutate({ columnName, updates: { name: newName } })
    },
  })

  const onOpenRowModalRef = useRef(onOpenRowModal)
  onOpenRowModalRef.current = onOpenRowModal

  const toggleBooleanCell = useCallback(
    (rowId: string, columnName: string, currentValue: unknown) => {
      const newValue = !currentValue
      pushUndoRef.current({
        type: 'update-cell',
        rowId,
        columnName,
        previousValue: currentValue ?? null,
        newValue,
      })
      mutateRef.current({
        rowId,
        data: { [columnName]: newValue as import('@/lib/table').JsonValue },
      })
    },
    []
  )
  const toggleBooleanCellRef = useRef(toggleBooleanCell)
  toggleBooleanCellRef.current = toggleBooleanCell

  function handleContextMenuEditCell() {
    if (contextMenu.row && contextMenu.columnName) {
      const column = columnsRef.current.find((c) => c.name === contextMenu.columnName)
      if (column?.type === 'boolean') {
        toggleBooleanCell(
          contextMenu.row.id,
          contextMenu.columnName,
          contextMenu.row.data[contextMenu.columnName]
        )
      } else if (column) {
        setEditingCell({ rowId: contextMenu.row.id, columnName: contextMenu.columnName })
        setInitialCharacter(null)
      }
    }
    closeContextMenu()
  }

  function handleContextMenuDelete() {
    const contextRow = contextMenu.row
    if (!contextRow) {
      closeContextMenu()
      return
    }
    const rowSel = rowSelectionRef.current
    const currentRows = rowsRef.current
    const contextRowInRows = currentRows.some((r) => r.id === contextRow.id)

    if (rowSel.kind === 'all' && contextRowInRows) {
      closeContextMenu()
      void (async () => {
        const allRows = await ensureAllRowsLoadedRef.current()
        const snapshots = collectRowSnapshots(allRows)
        if (snapshots.length > 0) onRequestDeleteRows(snapshots)
      })().catch((error) => {
        logger.error('Failed to load rows for delete', { error })
        toast.error('Failed to delete rows — please try again')
      })
      return
    }

    let snapshots: DeletedRowSnapshot[] = []
    if (rowSel.kind === 'some' && rowSel.ids.has(contextRow.id)) {
      snapshots = collectRowSnapshots(currentRows.filter((r) => rowSel.ids.has(r.id)))
    } else {
      const sel = computeNormalizedSelection(selectionAnchorRef.current, selectionFocusRef.current)
      const ctxIdx = currentRows.findIndex((r) => r.id === contextRow.id)
      const isInSel = sel !== null && ctxIdx >= sel.startRow && ctxIdx <= sel.endRow
      if (isInSel && sel) {
        snapshots = collectRowSnapshots(currentRows.slice(sel.startRow, sel.endRow + 1))
      } else {
        snapshots = [
          { rowId: contextRow.id, data: { ...contextRow.data }, position: contextRow.position },
        ]
      }
    }
    if (snapshots.length > 0) onRequestDeleteRows(snapshots)
    closeContextMenu()
  }

  function handleInsertRow(offset: 0 | 1) {
    if (!contextMenu.row) return
    const position = contextMenu.row.position + offset
    createRef.current(
      { data: {}, position, workspaceId },
      {
        onSuccess: (response: TableRowType) => {
          const newRowId = response?.id
          if (newRowId) pushUndoRef.current({ type: 'create-row', rowId: newRowId, position })
        },
      }
    )
    closeContextMenu()
  }

  const handleInsertRowAbove = () => handleInsertRow(0)
  const handleInsertRowBelow = () => handleInsertRow(1)

  function handleDuplicateRow() {
    const contextRow = contextMenu.row
    if (!contextRow) return
    const rowData = { ...contextRow.data }
    const position = contextRow.position + 1
    const sourceIdx = rowsRef.current.findIndex((r) => r.id === contextRow.id)
    closeContextMenu()
    createRef.current(
      { data: rowData, position, workspaceId },
      {
        onSuccess: (response: TableRowType) => {
          const newRowId = response?.id
          if (newRowId)
            pushUndoRef.current({
              type: 'create-row',
              rowId: newRowId,
              position,
              data: rowData as import('@/lib/table').RowData,
            })
          const colIndex = selectionAnchorRef.current?.colIndex ?? 0
          if (sourceIdx !== -1) {
            setSelectionAnchor({ rowIndex: sourceIdx + 1, colIndex })
            setSelectionFocus(null)
          }
        },
      }
    )
  }

  const handleAppendRow = useCallback(async () => {
    if (isAppendingRowRef.current) return
    isAppendingRowRef.current = true
    try {
      while (hasNextPageRef.current) {
        const result = await fetchNextPageRef.current()
        if (!result.hasNextPage) break
      }
    } catch (error) {
      isAppendingRowRef.current = false
      logger.error('Failed to load remaining rows before appending', { error })
      toast.error('Failed to load all rows. Try again.', { duration: 5000 })
      return
    }
    createRef.current(
      { data: {}, workspaceId },
      {
        onSuccess: (response: TableRowType) => {
          const newRowId = response?.id
          if (newRowId) {
            const maxPosition = rowsRef.current.reduce((max, r) => Math.max(max, r.position), -1)
            pushUndoRef.current({ type: 'create-row', rowId: newRowId, position: maxPosition + 1 })
          }
        },
        onSettled: () => {
          isAppendingRowRef.current = false
        },
      }
    )
  }, [])

  const handleRowContextMenu = useCallback(
    (e: React.MouseEvent, row: TableRowType) => {
      setEditingCell(null)
      const td = (e.target as HTMLElement).closest('td[data-col]') as HTMLElement | null
      let columnName: string | null = null
      if (td) {
        const rowIndex = Number.parseInt(td.getAttribute('data-row') || '-1', 10)
        const colIndex = Number.parseInt(td.getAttribute('data-col') || '-1', 10)
        if (rowIndex >= 0 && colIndex >= 0) {
          columnName =
            colIndex < columnsRef.current.length ? columnsRef.current[colIndex].name : null
          const sel = computeNormalizedSelection(
            selectionAnchorRef.current,
            selectionFocusRef.current
          )
          const isWithinSel =
            sel !== null &&
            rowIndex >= sel.startRow &&
            rowIndex <= sel.endRow &&
            colIndex >= sel.startCol &&
            colIndex <= sel.endCol
          if (!isWithinSel) {
            setSelectionAnchor({ rowIndex, colIndex })
            setSelectionFocus(null)
          }
        }
      }
      baseHandleRowContextMenu(e, row, columnName)
    },
    [baseHandleRowContextMenu]
  )

  // Selected row ids for context
  const selectedRowCount = useMemo(() => {
    const rowSel = rowSelection
    if (rowSel.kind === 'none') {
      const sel = normalizedSelection
      if (!sel) return 0
      return sel.endRow - sel.startRow + 1
    }
    if (rowSel.kind === 'all') return rows.length
    return rowSel.ids.size
  }, [rowSelection, normalizedSelection, rows.length])

  const handleRowToggle = useCallback((rowIndex: number, shiftKey: boolean) => {
    setEditingCell(null)
    setSelectionAnchor(null)
    setSelectionFocus(null)
    setIsColumnSelection(false)

    const currentRows = rowsRef.current
    const targetRow = currentRows[rowIndex]
    if (!targetRow) return
    const targetId = targetRow.id
    const lastIdx =
      shiftKey && lastCheckboxRowRef.current !== null
        ? currentRows.findIndex((r) => r.id === lastCheckboxRowRef.current)
        : -1

    setRowSelection((prev) => {
      const next = rowSelectionMaterialize(prev, currentRows)
      if (lastIdx !== -1) {
        const from = Math.min(lastIdx, rowIndex)
        const to = Math.max(lastIdx, rowIndex)
        for (let i = from; i <= to; i++) {
          const r = currentRows[i]
          if (r) next.add(r.id)
        }
      } else if (next.has(targetId)) {
        next.delete(targetId)
      } else {
        next.add(targetId)
      }
      return next.size === 0 ? ROW_SELECTION_NONE : { kind: 'some', ids: next }
    })
    lastCheckboxRowRef.current = targetId
    scrollRef.current?.focus({ preventScroll: true })
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectionAnchor(null)
    setSelectionFocus(null)
    setRowSelection((prev) => (prev.kind === 'none' ? prev : ROW_SELECTION_NONE))
    setIsColumnSelection(false)
    lastCheckboxRowRef.current = null
  }, [])

  afterDeleteRowsSinkRef.current = (snapshots: DeletedRowSnapshot[]) => {
    pushUndoRef.current({ type: 'delete-rows', rows: snapshots })
    handleClearSelection()
  }

  pushTableRenameUndoSinkRef.current = (previousName: string, newName: string) => {
    pushUndoRef.current({ type: 'rename-table', tableId, previousName, newName })
  }

  const handleColumnSelect = useCallback((colIndex: number, shiftKey: boolean) => {
    const lastRow = rowsRef.current.length - 1
    if (lastRow < 0) return
    setEditingCell(null)
    setRowSelection((prev) => (prev.kind === 'none' ? prev : ROW_SELECTION_NONE))
    lastCheckboxRowRef.current = null
    if (shiftKey && isColumnSelectionRef.current && selectionAnchorRef.current) {
      setSelectionFocus({ rowIndex: lastRow, colIndex })
    } else {
      setSelectionAnchor({ rowIndex: 0, colIndex })
      setSelectionFocus({ rowIndex: lastRow, colIndex })
      setIsColumnSelection(true)
    }
    scrollRef.current?.focus({ preventScroll: true })
  }, [])

  const handleSelectAllRows = useCallback(() => {
    const rws = rowsRef.current
    const currentCols = columnsRef.current
    if (rws.length === 0 || currentCols.length === 0) return
    setEditingCell(null)
    setRowSelection(ROW_SELECTION_ALL)
    lastCheckboxRowRef.current = null
    suppressFocusScrollRef.current = true
    setSelectionAnchor({ rowIndex: 0, colIndex: 0 })
    setSelectionFocus({ rowIndex: rws.length - 1, colIndex: currentCols.length - 1 })
    setIsColumnSelection(false)
    scrollRef.current?.focus({ preventScroll: true })
  }, [])

  const handleSelectAllToggle = useCallback(() => {
    if (isAllRowsSelectedRef.current) {
      handleClearSelection()
    } else {
      handleSelectAllRows()
    }
  }, [handleClearSelection, handleSelectAllRows])

  const handleColumnResizeStart = useCallback((columnKey: string) => {
    setResizingColumn(columnKey)
  }, [])
  const handleColumnResize = useCallback((columnKey: string, width: number) => {
    setColumnWidths((prev) => ({ ...prev, [columnKey]: Math.max(COL_WIDTH_MIN, width) }))
  }, [])
  const handleColumnResizeEnd = useCallback(() => {
    setResizingColumn(null)
    updateMetadataRef.current({ columnWidths: columnWidthsRef.current })
  }, [])

  const handleColumnAutoResize = useCallback((columnKey: string) => {
    const cols = columnsRef.current
    const colIndex = cols.findIndex((c) => c.key === columnKey)
    if (colIndex === -1) return
    const column = cols[colIndex]
    if (column.type === 'boolean') return
    const host = containerRef.current ?? document.body
    const currentRows = rowsRef.current
    let maxWidth = COL_WIDTH_MIN
    const measure = document.createElement('span')
    measure.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;top:-9999px'
    host.appendChild(measure)
    try {
      measure.className = 'font-medium text-sm'
      measure.textContent = column.name
      maxWidth = Math.max(maxWidth, measure.getBoundingClientRect().width + 57)
      measure.className = 'text-sm'
      for (const row of currentRows) {
        const val = row.data[column.name]
        if (val == null) continue
        let text: string
        if (column.type === 'json') {
          text = typeof val === 'string' ? val : JSON.stringify(val)
        } else if (column.type === 'date') {
          text = storageToDisplay(String(val))
        } else {
          text = String(val)
        }
        measure.textContent = text
        maxWidth = Math.max(maxWidth, measure.getBoundingClientRect().width + 17)
      }
    } finally {
      host.removeChild(measure)
    }
    const newWidth = Math.min(Math.ceil(maxWidth), COL_WIDTH_AUTO_FIT_MAX)
    setColumnWidths((prev) => ({ ...prev, [columnKey]: newWidth }))
    const updated = { ...columnWidthsRef.current, [columnKey]: newWidth }
    columnWidthsRef.current = updated
    updateMetadataRef.current({ columnWidths: updated })
  }, [])

  const handleColumnDragStart = useCallback((columnName: string) => {
    setDragColumnName(columnName)
    setSelectionAnchor(null)
    setSelectionFocus(null)
    setRowSelection((prev) => (prev.kind === 'none' ? prev : ROW_SELECTION_NONE))
    setIsColumnSelection(false)
  }, [])

  const handleColumnDragOver = useCallback((columnName: string, side: 'left' | 'right') => {
    if (columnName === dropTargetColumnNameRef.current && side === dropSideRef.current) return
    setDropTargetColumnName(columnName)
    setDropSide(side)
  }, [])

  const handleColumnDragEnd = useCallback(() => {
    const dragged = dragColumnNameRef.current
    if (!dragged) {
      setDragColumnName(null)
      setDropTargetColumnName(null)
      setDropSide('left')
      return
    }
    dragColumnNameRef.current = null
    const target = dropTargetColumnNameRef.current
    const side = dropSideRef.current
    if (target && dragged !== target) {
      const schemaCols = schemaColumnsRef.current
      const persisted = columnOrderRef.current ?? schemaCols.map((c) => c.name)
      const known = new Set(persisted)
      const missing = schemaCols.map((c) => c.name).filter((n) => !known.has(n))
      const currentOrder = missing.length > 0 ? [...persisted, ...missing] : persisted
      const fromIndex = currentOrder.indexOf(dragged)
      if (fromIndex !== -1) {
        const remaining = currentOrder.filter((n) => n !== dragged)
        let insertIndex = remaining.indexOf(target)
        if (insertIndex === -1) insertIndex = remaining.length
        if (side === 'right') insertIndex += 1
        const newOrder = [
          ...remaining.slice(0, insertIndex),
          dragged,
          ...remaining.slice(insertIndex),
        ]
        const orderChanged = newOrder.some((name, i) => currentOrder[i] !== name)
        if (orderChanged) {
          pushUndoRef.current({ type: 'reorder-columns', previousOrder: currentOrder, newOrder })
          setColumnOrder(newOrder)
          updateMetadataRef.current({
            columnWidths: columnWidthsRef.current,
            columnOrder: newOrder,
          })
        }
      }
    }
    setDragColumnName(null)
    setDropTargetColumnName(null)
    setDropSide('left')
  }, [])

  const handleColumnDragLeave = useCallback(() => {
    dropTargetColumnNameRef.current = null
    setDropTargetColumnName(null)
  }, [])

  function handleScrollDragOver(e: React.DragEvent) {
    if (!dragColumnNameRef.current) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const scrollEl = scrollRef.current
    if (!scrollEl) return
    const scrollRect = scrollEl.getBoundingClientRect()
    const cursorX = e.clientX - scrollRect.left + scrollEl.scrollLeft
    const cols = columnsRef.current
    let left = checkboxColWidth
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i]
      const w = columnWidthsRef.current[col.key] ?? COL_WIDTH
      if (cursorX < left + w) {
        const side = cursorX < left + w / 2 ? 'left' : 'right'
        if (col.name !== dropTargetColumnNameRef.current || side !== dropSideRef.current) {
          setDropTargetColumnName(col.name)
          setDropSide(side)
        }
        return
      }
      left += w
    }
  }

  function handleScrollDrop(e: React.DragEvent) {
    e.preventDefault()
  }

  // Scroll-based row prefetch
  useEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return
    const SCROLL_PREFETCH_PX = 600
    function maybeFetchNext() {
      if (!hasNextPageRef.current || isFetchingNextPageRef.current) return
      if (!scrollEl) return
      const distanceFromBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight
      if (distanceFromBottom <= SCROLL_PREFETCH_PX) {
        fetchNextPageRef.current().catch((error) => {
          logger.error('Failed to fetch next page', { error })
        })
      }
    }
    maybeFetchNext()
    scrollEl.addEventListener('scroll', maybeFetchNext, { passive: true })
    return () => {
      scrollEl.removeEventListener('scroll', maybeFetchNext)
    }
  }, [tableData?.id])

  // Seed metadata from server on first load
  useEffect(() => {
    if (!tableData?.metadata) return
    if (!tableData.metadata.columnWidths && !tableData.metadata.columnOrder) return
    if (!metadataSeededRef.current) {
      metadataSeededRef.current = true
      if (tableData.metadata.columnWidths) setColumnWidths(tableData.metadata.columnWidths)
      if (tableData.metadata.columnOrder) setColumnOrder(tableData.metadata.columnOrder)
      return
    }
    const serverOrder = tableData.metadata.columnOrder
    if (serverOrder) {
      const localOrder = columnOrderRef.current
      const serverSet = new Set(serverOrder)
      const localSet = new Set(localOrder ?? [])
      const setChanged =
        !localOrder || serverSet.size !== localSet.size || serverOrder.some((n) => !localSet.has(n))
      if (setChanged) setColumnOrder(serverOrder)
    }
  }, [tableData?.metadata])

  // Extend column selection focus to last row as rows load
  useEffect(() => {
    if (!isColumnSelection || !selectionAnchor) return
    const lastRow = rows.length - 1
    if (lastRow < 0) return
    setSelectionFocus((prev) => {
      if (!prev || prev.rowIndex !== lastRow) {
        return { rowIndex: lastRow, colIndex: prev?.colIndex ?? selectionAnchor.colIndex }
      }
      return prev
    })
  }, [isColumnSelection, rows.length, selectionAnchor])

  useEffect(() => {
    const handleMouseUp = () => {
      isDraggingRef.current = false
    }
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [])

  // Auto-scroll during cell drag
  useEffect(() => {
    const HOT_ZONE_PX = 48
    const MAX_VELOCITY_PX = 14
    let pointerX: number | null = null
    let pointerY: number | null = null
    let rafId: number | null = null

    const updateFocusUnderCursor = () => {
      if (pointerX === null || pointerY === null) return
      const target = document.elementFromPoint(pointerX, pointerY)
      if (!target) return
      const td = (target as HTMLElement).closest('td[data-row][data-col]') as HTMLElement | null
      if (!td) return
      const rowIndex = Number.parseInt(td.getAttribute('data-row') ?? '', 10)
      const colIndex = Number.parseInt(td.getAttribute('data-col') ?? '', 10)
      if (Number.isNaN(rowIndex) || Number.isNaN(colIndex)) return
      setSelectionFocus({ rowIndex, colIndex })
    }

    const tick = () => {
      rafId = null
      const el = scrollRef.current
      if (!isDraggingRef.current || !el || pointerY === null) return
      const rect = el.getBoundingClientRect()
      const distFromTop = pointerY - rect.top
      const distFromBottom = rect.bottom - pointerY
      let dy = 0
      if (distFromTop < HOT_ZONE_PX) {
        const intensity = 1 - Math.max(0, distFromTop) / HOT_ZONE_PX
        dy = -Math.ceil(intensity * MAX_VELOCITY_PX)
      } else if (distFromBottom < HOT_ZONE_PX) {
        const intensity = 1 - Math.max(0, distFromBottom) / HOT_ZONE_PX
        dy = Math.ceil(intensity * MAX_VELOCITY_PX)
      }
      if (dy !== 0) {
        el.scrollTop += dy
        updateFocusUnderCursor()
        rafId = requestAnimationFrame(tick)
      }
    }

    const handleMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      pointerX = e.clientX
      pointerY = e.clientY
      if (rafId === null) rafId = requestAnimationFrame(tick)
    }

    const handleStop = () => {
      pointerX = null
      pointerY = null
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleStop)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleStop)
      handleStop()
    }
  }, [])

  // Remap selection by row id when rows change order
  useEffect(() => {
    if (rows.length === 0) return
    if (isColumnSelectionRef.current) return
    const anchor = selectionAnchorRef.current
    if (anchor) {
      const expectedId = anchorRowIdRef.current
      const actualId = rows[anchor.rowIndex]?.id ?? null
      if (expectedId && expectedId !== actualId) {
        const newIndex = rows.findIndex((r) => r.id === expectedId)
        if (newIndex >= 0) {
          setSelectionAnchor({ rowIndex: newIndex, colIndex: anchor.colIndex })
        } else {
          setSelectionAnchor(null)
        }
      } else if (anchor.rowIndex >= rows.length) {
        setSelectionAnchor(null)
      }
    }
    const focus = selectionFocusRef.current
    if (focus) {
      const expectedId = focusRowIdRef.current
      const actualId = rows[focus.rowIndex]?.id ?? null
      if (expectedId && expectedId !== actualId) {
        const newIndex = rows.findIndex((r) => r.id === expectedId)
        if (newIndex >= 0) {
          setSelectionFocus({ rowIndex: newIndex, colIndex: focus.colIndex })
        } else {
          setSelectionFocus(null)
        }
      } else if (focus.rowIndex >= rows.length) {
        setSelectionFocus(null)
      }
    }
  }, [rows])

  // Scroll selected cell into view
  useEffect(() => {
    if (isColumnSelection) return
    if (suppressFocusScrollRef.current) {
      suppressFocusScrollRef.current = false
      return
    }
    const target = selectionFocus ?? selectionAnchor
    if (!target) return
    const { rowIndex, colIndex } = target
    const selector = `[data-table-scroll] [data-row="${rowIndex}"][data-col="${colIndex}"]`
    const revealCell = (cell: HTMLElement) => {
      const scrollEl = scrollRef.current
      if (!scrollEl) return
      const view = scrollEl.getBoundingClientRect()
      const rect = cell.getBoundingClientRect()
      const topInset = theadRef.current?.offsetHeight ?? 0
      if (rect.top < view.top + topInset) scrollEl.scrollTop -= view.top + topInset - rect.top
      else if (rect.bottom > view.bottom) scrollEl.scrollTop += rect.bottom - view.bottom
      if (rect.left < view.left + checkboxColWidth)
        scrollEl.scrollLeft -= view.left + checkboxColWidth - rect.left
      else if (rect.right > view.right) scrollEl.scrollLeft += rect.right - view.right
    }
    let secondRaf = 0
    const rafId = requestAnimationFrame(() => {
      const cell = document.querySelector(selector) as HTMLElement | null
      if (cell) {
        revealCell(cell)
        return
      }
      rowVirtualizer.scrollToIndex(rowIndex, { align: 'auto' })
      secondRaf = requestAnimationFrame(() => {
        const rendered = document.querySelector(selector) as HTMLElement | null
        if (rendered) revealCell(rendered)
      })
    })
    return () => {
      cancelAnimationFrame(rafId)
      if (secondRaf) cancelAnimationFrame(secondRaf)
    }
  }, [selectionAnchor, selectionFocus, isColumnSelection, rowVirtualizer, checkboxColWidth])

  const handleCellClick = useCallback(
    (rowId: string, columnName: string, options?: { toggleBoolean?: boolean }) => {
      const column = columnsRef.current.find((c) => c.name === columnName)
      if (column?.type === 'boolean') {
        if (!options?.toggleBoolean || !canEditRef.current) return
        const row = rowsRef.current.find((r) => r.id === rowId)
        if (row) toggleBooleanCell(rowId, columnName, row.data[columnName])
        return
      }
    },
    [toggleBooleanCell]
  )

  const handleCellDoubleClick = useCallback(
    (rowId: string, columnName: string, _columnKey: string) => {
      if (!canEditRef.current) return
      const column = columnsRef.current.find((c) => c.name === columnName)
      if (!column || column.type === 'boolean') return
      setEditingCell({ rowId, columnName })
      setInitialCharacter(null)
    },
    []
  )

  const handleCellMouseDown = useCallback(
    (rowIndex: number, colIndex: number, shiftKey: boolean) => {
      setEditingCell(null)
      setInitialCharacter(null)
      setRowSelection((prev) => (prev.kind === 'none' ? prev : ROW_SELECTION_NONE))
      setIsColumnSelection(false)
      lastCheckboxRowRef.current = null
      isDraggingRef.current = true
      if (shiftKey && selectionAnchorRef.current) {
        setSelectionFocus({ rowIndex, colIndex })
      } else {
        setSelectionAnchor({ rowIndex, colIndex })
        setSelectionFocus(null)
      }
      scrollRef.current?.focus({ preventScroll: true })
    },
    []
  )

  const handleCellMouseEnter = useCallback((rowIndex: number, colIndex: number) => {
    if (!isDraggingRef.current) return
    setSelectionFocus({ rowIndex, colIndex })
  }, [])

  const handleInlineSave = useCallback(
    (rowId: string, columnName: string, value: unknown, reason: SaveReason) => {
      const cols = columnsRef.current
      const anchor = selectionAnchorRef.current
      const row = rowsRef.current.find((r) => r.id === rowId)
      const previousValue = row?.data[columnName] ?? null
      const col = cols.find((c) => c.name === columnName)
      const cleanedValue = col ? cleanCellValue(value, col) : value

      setPendingUpdate({
        rowId,
        data: { [columnName]: cleanedValue as import('@/lib/table').JsonValue },
      })
      pushUndoRef.current({
        type: 'update-cell',
        rowId,
        columnName,
        previousValue,
        newValue: cleanedValue,
      })
      mutateRef.current(
        { rowId, data: { [columnName]: cleanedValue as import('@/lib/table').JsonValue } },
        { onSettled: () => setPendingUpdate(null) }
      )

      const colIndex = cols.findIndex((c) => c.name === columnName)
      const rowIndex = rowsRef.current.findIndex((r) => r.id === rowId)

      if (reason === 'enter') {
        setEditingCell(null)
        setInitialCharacter(null)
        if (rowIndex < rowsRef.current.length - 1) {
          setSelectionAnchor({ rowIndex: rowIndex + 1, colIndex })
          setSelectionFocus(null)
        }
      } else if (reason === 'tab') {
        const nextCoord = moveCell({ rowIndex, colIndex }, cols.length, rowsRef.current.length, 1)
        setSelectionAnchor(nextCoord)
        setSelectionFocus(null)
        const nextRow = rowsRef.current[nextCoord.rowIndex]
        const nextCol = cols[nextCoord.colIndex]
        if (nextRow && nextCol && nextCol.type !== 'boolean') {
          setEditingCell({ rowId: nextRow.id, columnName: nextCol.name })
          setInitialCharacter(null)
        } else {
          setEditingCell(null)
          setInitialCharacter(null)
        }
      } else if (reason === 'shift-tab') {
        const nextCoord = moveCell({ rowIndex, colIndex }, cols.length, rowsRef.current.length, -1)
        setSelectionAnchor(nextCoord)
        setSelectionFocus(null)
        const nextRow = rowsRef.current[nextCoord.rowIndex]
        const nextCol = cols[nextCoord.colIndex]
        if (nextRow && nextCol && nextCol.type !== 'boolean') {
          setEditingCell({ rowId: nextRow.id, columnName: nextCol.name })
          setInitialCharacter(null)
        } else {
          setEditingCell(null)
          setInitialCharacter(null)
        }
      } else {
        setEditingCell(null)
        setInitialCharacter(null)
      }
    },
    []
  )

  const handleInlineCancel = useCallback(() => {
    setEditingCell(null)
    setInitialCharacter(null)
  }, [])

  // Column CRUD
  function handleAddColumnOfType(type: ColumnDefinition['type']) {
    const existingNames = new Set(schemaColumnsRef.current.map((c) => c.name))
    const baseName = type.charAt(0).toUpperCase() + type.slice(1)
    let name = baseName
    let suffix = 1
    while (existingNames.has(name)) {
      name = `${baseName} ${++suffix}`
    }
    addColumnMutation.mutate(
      { name, type },
      {
        onSuccess: (_response: TableDefinition) => {
          pushUndoRef.current({
            type: 'create-column',
            columnName: name,
            position: schemaColumnsRef.current.length,
          })
        },
      }
    )
  }

  function handleChangeType(columnName: string, newType: ColumnDefinition['type']) {
    const col = schemaColumnsRef.current.find((c) => c.name === columnName)
    if (!col) return
    pushUndoRef.current({ type: 'update-column-type', columnName, previousType: col.type, newType })
    updateColumnMutation.mutate({ columnName, updates: { type: newType } })
  }

  function handleInsertColumnLeft(columnName: string) {
    const cols = schemaColumnsRef.current
    const idx = cols.findIndex((c) => c.name === columnName)
    const existingNames = new Set(cols.map((c) => c.name))
    let name = 'Column'
    let suffix = 1
    while (existingNames.has(name)) {
      name = `Column ${++suffix}`
    }
    const position = idx > 0 ? cols[idx - 1].name + columnName : columnName
    addColumnMutation.mutate({ name, type: 'string' })
  }

  function handleInsertColumnRight(columnName: string) {
    const existingNames = new Set(schemaColumnsRef.current.map((c) => c.name))
    let name = 'Column'
    let suffix = 1
    while (existingNames.has(name)) {
      name = `Column ${++suffix}`
    }
    addColumnMutation.mutate({ name, type: 'string' })
  }

  function handleDeleteColumn(columnName: string) {
    onRequestDeleteColumns([columnName])
  }

  confirmDeleteColumnsSinkRef.current = (names: string[]) => {
    for (const name of names) {
      deleteColumnMutation.mutate(name)
    }
    const updatedOrder = columnOrderRef.current?.filter((n) => !names.includes(n))
    if (updatedOrder) setColumnOrder(updatedOrder)
    const updatedWidths = { ...columnWidthsRef.current }
    for (const name of names) {
      delete updatedWidths[name]
    }
    setColumnWidths(updatedWidths)
    pushUndoRef.current({
      type: 'delete-column',
      columnName: names[0] ?? '',
      columnType: schemaColumnsRef.current.find((c) => c.name === names[0])?.type ?? 'string',
      columnPosition: 0,
      columnUnique: false,
      columnRequired: false,
      cellData: [],
      previousOrder: columnOrderRef.current ?? null,
      previousWidth: null,
    })
  }

  function handleConfigureColumn(columnName: string) {
    const col = schemaColumnsRef.current.find((c) => c.name === columnName)
    if (col) onOpenColumnConfig({ mode: 'edit', columnName: col.name })
  }

  // Keyboard handler
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'y')) {
        e.preventDefault()
        if (e.key === 'y' || e.shiftKey) redoRef.current()
        else undoRef.current()
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        if (dragColumnNameRef.current) {
          dragColumnNameRef.current = null
          dropTargetColumnNameRef.current = null
          setDragColumnName(null)
          setDropTargetColumnName(null)
          return
        }
        setSelectionAnchor(null)
        setSelectionFocus(null)
        setRowSelection((prev) => (prev.kind === 'none' ? prev : ROW_SELECTION_NONE))
        setIsColumnSelection(false)
        lastCheckboxRowRef.current = null
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        handleSelectAllRows()
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        const sel = computeNormalizedSelection(
          selectionAnchorRef.current,
          selectionFocusRef.current
        )
        if (!sel) return
        const rows = rowsRef.current
        const cols = columnsRef.current
        const lines: string[] = []
        for (let r = sel.startRow; r <= sel.endRow; r++) {
          const row = rows[r]
          if (!row) continue
          const cells: string[] = []
          for (let c = sel.startCol; c <= sel.endCol; c++) {
            if (c < cols.length) cells.push(cellToText(row.data[cols[c].name]))
          }
          lines.push(cells.join('\t'))
        }
        void navigator.clipboard.writeText(lines.join('\n'))
        return
      }

      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        !rowSelectionIsEmpty(rowSelectionRef.current)
      ) {
        if (editingCellRef.current) return
        if (!canEditRef.current) return
        e.preventDefault()
        const rowSel = rowSelectionRef.current
        void (async () => {
          const allRows = await ensureAllRowsLoadedRef.current()
          const currentCols = columnsRef.current
          const undoCells: Array<{ rowId: string; data: Record<string, unknown> }> = []
          const batchUpdates: Array<{ rowId: string; data: Record<string, unknown> }> = []
          for (const row of allRows) {
            if (!rowSelectionIncludes(rowSel, row.id)) continue
            const updates: Record<string, unknown> = {}
            const previousData: Record<string, unknown> = {}
            for (const col of currentCols) {
              previousData[col.name] = row.data[col.name] ?? null
              updates[col.name] = null
            }
            undoCells.push({ rowId: row.id, data: previousData })
            batchUpdates.push({ rowId: row.id, data: updates })
          }
          if (undoCells.length > 0)
            pushUndoRef.current({
              type: 'clear-cells',
              cells: undoCells as Array<{ rowId: string; data: RowData }>,
            })
          await chunkBatchUpdates(
            batchUpdates as Array<{ rowId: string; data: RowData }>,
            batchUpdateAsyncRef.current as (
              args: Array<{ rowId: string; data: RowData }>
            ) => Promise<unknown>
          )
        })().catch((error) => {
          logger.error('Failed to clear selected cells', { error })
          toast.error('Failed to clear cells — please try again')
        })
        return
      }

      const anchor = selectionAnchorRef.current
      if (!anchor || editingCellRef.current) return

      const cols = columnsRef.current
      const currentRows = rowsRef.current
      const totalRows = currentRows.length

      if (e.shiftKey && e.key === 'Enter') {
        if (!canEditRef.current) return
        const row = currentRows[anchor.rowIndex]
        if (!row) return
        e.preventDefault()
        const position = row.position + 1
        const colIndex = anchor.colIndex
        createRef.current(
          { data: {}, position, workspaceId },
          {
            onSuccess: () => {
              setSelectionFocus({ rowIndex: anchor.rowIndex + 1, colIndex })
            },
          }
        )
        return
      }

      if (e.key === 'Enter' || e.key === 'F2') {
        if (!canEditRef.current) return
        e.preventDefault()
        const col = cols[anchor.colIndex]
        if (!col) return
        const row = currentRows[anchor.rowIndex]
        if (!row) return
        if (col.type === 'boolean') {
          toggleBooleanCellRef.current(row.id, col.name, row.data[col.name])
          return
        }
        setEditingCell({ rowId: row.id, columnName: col.name })
        setInitialCharacter(null)
        return
      }

      if (e.key === ' ' && !e.shiftKey) {
        if (!canEditRef.current) return
        e.preventDefault()
        const row = currentRows[anchor.rowIndex]
        if (row) onOpenRowModalRef.current(row)
        return
      }

      if (e.key === 'Tab') {
        e.preventDefault()
        setRowSelection((prev) => (prev.kind === 'none' ? prev : ROW_SELECTION_NONE))
        setIsColumnSelection(false)
        lastCheckboxRowRef.current = null
        setSelectionAnchor(moveCell(anchor, cols.length, totalRows, e.shiftKey ? -1 : 1))
        setSelectionFocus(null)
        return
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        setRowSelection((prev) => (prev.kind === 'none' ? prev : ROW_SELECTION_NONE))
        setIsColumnSelection(false)
        lastCheckboxRowRef.current = null
        const focus = selectionFocusRef.current ?? anchor
        const origin = e.shiftKey ? focus : anchor
        const jump = e.metaKey || e.ctrlKey
        let newRow = origin.rowIndex
        let newCol = origin.colIndex
        switch (e.key) {
          case 'ArrowUp':
            newRow = jump ? 0 : Math.max(0, newRow - 1)
            break
          case 'ArrowDown':
            newRow = jump ? totalRows - 1 : Math.min(totalRows - 1, newRow + 1)
            break
          case 'ArrowLeft':
            newCol = jump ? 0 : Math.max(0, newCol - 1)
            break
          case 'ArrowRight':
            newCol = jump ? cols.length - 1 : Math.min(cols.length - 1, newCol + 1)
            break
        }
        if (e.shiftKey) {
          setSelectionFocus({ rowIndex: newRow, colIndex: newCol })
        } else {
          setSelectionAnchor({ rowIndex: newRow, colIndex: newCol })
          setSelectionFocus(null)
        }
        return
      }

      if (e.key === 'Home') {
        e.preventDefault()
        setIsColumnSelection(false)
        const jump = e.metaKey || e.ctrlKey
        if (e.shiftKey) {
          const focus = selectionFocusRef.current ?? anchor
          setSelectionFocus({ rowIndex: jump ? 0 : focus.rowIndex, colIndex: 0 })
        } else {
          setSelectionAnchor({ rowIndex: jump ? 0 : anchor.rowIndex, colIndex: 0 })
          setSelectionFocus(null)
        }
        return
      }

      if (e.key === 'End') {
        e.preventDefault()
        setIsColumnSelection(false)
        const jump = e.metaKey || e.ctrlKey
        if (e.shiftKey) {
          const focus = selectionFocusRef.current ?? anchor
          setSelectionFocus({
            rowIndex: jump ? totalRows - 1 : focus.rowIndex,
            colIndex: cols.length - 1,
          })
        } else {
          setSelectionAnchor({
            rowIndex: jump ? totalRows - 1 : anchor.rowIndex,
            colIndex: cols.length - 1,
          })
          setSelectionFocus(null)
        }
        return
      }

      if (e.key === 'PageUp' || e.key === 'PageDown') {
        e.preventDefault()
        setIsColumnSelection(false)
        const scrollEl = scrollRef.current
        const viewportHeight = scrollEl ? scrollEl.clientHeight : ROW_HEIGHT_ESTIMATE * 10
        const rowsPerPage = Math.max(1, Math.floor(viewportHeight / ROW_HEIGHT_ESTIMATE))
        const direction = e.key === 'PageUp' ? -1 : 1
        const origin = e.shiftKey ? (selectionFocusRef.current ?? anchor) : anchor
        const newRow = Math.max(
          0,
          Math.min(totalRows - 1, origin.rowIndex + direction * rowsPerPage)
        )
        if (e.shiftKey) {
          setSelectionFocus({ rowIndex: newRow, colIndex: origin.colIndex })
        } else {
          setSelectionAnchor({ rowIndex: newRow, colIndex: anchor.colIndex })
          setSelectionFocus(null)
        }
        return
      }

      // Delete/Backspace on cell range
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!canEditRef.current) return
        e.preventDefault()
        const sel = computeNormalizedSelection(anchor, selectionFocusRef.current)
        if (!sel) return
        const undoCells: Array<{ rowId: string; data: Record<string, unknown> }> = []
        const batchUpdates: Array<{ rowId: string; data: Record<string, unknown> }> = []
        for (let r = sel.startRow; r <= sel.endRow; r++) {
          const row = currentRows[r]
          if (!row) continue
          const updates: Record<string, unknown> = {}
          const previousData: Record<string, unknown> = {}
          for (let c = sel.startCol; c <= sel.endCol; c++) {
            if (c < cols.length) {
              const colName = cols[c].name
              previousData[colName] = row.data[colName] ?? null
              updates[colName] = null
            }
          }
          undoCells.push({ rowId: row.id, data: previousData })
          batchUpdates.push({ rowId: row.id, data: updates })
        }
        if (undoCells.length > 0) {
          pushUndoRef.current({
            type: 'clear-cells',
            cells: undoCells as Array<{ rowId: string; data: RowData }>,
          })
          batchUpdateRef.current(batchUpdates as Array<{ rowId: string; data: RowData }>)
        }
        return
      }

      // Printable character starts inline edit
      if (!canEditRef.current) return
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
        const col = cols[anchor.colIndex]
        if (!col || col.type === 'boolean') return
        const row = currentRows[anchor.rowIndex]
        if (!row) return
        setEditingCell({ rowId: row.id, columnName: col.name })
        setInitialCharacter(e.key)
      }
    }

    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [handleSelectAllRows, toggleBooleanCell])

  // Paste handler
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handlePaste = (e: ClipboardEvent) => {
      if (!canEditRef.current) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const anchor = selectionAnchorRef.current
      if (!anchor) return
      e.preventDefault()
      const text = e.clipboardData?.getData('text') ?? ''
      const lines = text.split('\n').map((l) => l.split('\t'))
      const cols = columnsRef.current
      const rows = rowsRef.current
      const updates: Array<{ rowId: string; data: Record<string, unknown> }> = []
      const undoCells: Array<{ rowId: string; data: Record<string, unknown> }> = []
      for (let r = 0; r < lines.length; r++) {
        const rowIndex = anchor.rowIndex + r
        const row = rows[rowIndex]
        if (!row) continue
        const rowData: Record<string, unknown> = {}
        const prevData: Record<string, unknown> = {}
        for (let c = 0; c < lines[r].length; c++) {
          const colIndex = anchor.colIndex + c
          const col = cols[colIndex]
          if (!col) continue
          prevData[col.name] = row.data[col.name] ?? null
          rowData[col.name] = cleanCellValue(lines[r][c], col)
        }
        if (Object.keys(rowData).length > 0) {
          updates.push({ rowId: row.id, data: rowData })
          undoCells.push({ rowId: row.id, data: prevData })
        }
      }
      if (updates.length > 0) {
        pushUndoRef.current({
          type: 'update-cells',
          cells: undoCells.map((c, i) => ({
            rowId: c.rowId,
            oldData: c.data as RowData,
            newData: updates[i].data as RowData,
          })),
        })
        batchUpdateRef.current(updates as Array<{ rowId: string; data: RowData }>)
      }
    }
    el.addEventListener('paste', handlePaste)
    return () => el.removeEventListener('paste', handlePaste)
  }, [])

  const tableMinWidth = Math.max(tableWidth, 400)

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex h-full flex-col overflow-hidden outline-none',
        embedded ? '' : 'rounded-md border border-border bg-background'
      )}
    >
      <div
        ref={scrollRef}
        data-table-scroll
        className='relative flex-1 overflow-auto'
        onDragOver={handleScrollDragOver}
        onDrop={handleScrollDrop}
      >
        <div style={{ minWidth: tableMinWidth }}>
          <table className='w-full border-collapse' style={{ minWidth: tableMinWidth }}>
            <TableColGroup
              columns={displayColumns}
              columnWidths={columnWidths}
              checkboxColWidth={checkboxColWidth}
            />
            <thead ref={theadRef} className='sticky top-0 z-[10]'>
              {isLoadingTable ? (
                <tr>
                  <th className={cn(CELL_HEADER_CHECKBOX, 'text-center')}>
                    <div className='flex items-center justify-center'>
                      <Skeleton className='size-[14px] rounded-sm' />
                    </div>
                  </th>
                  {Array.from({ length: SKELETON_COL_COUNT }).map((_, i) => (
                    <th key={i} className={CELL_HEADER}>
                      <div className='flex h-[20px] min-w-0 items-center gap-1.5'>
                        <Skeleton className='size-[14px] shrink-0 rounded-sm' />
                        <Skeleton className='h-[14px]' style={{ width: `${56 + i * 16}px` }} />
                      </div>
                    </th>
                  ))}
                  <th className={CELL_HEADER}>
                    <div className='flex h-[20px] items-center gap-2'>
                      <Skeleton className='size-[14px] shrink-0 rounded-sm' />
                      <Skeleton className='h-[14px] w-[72px]' />
                    </div>
                  </th>
                </tr>
              ) : (
                <tr>
                  <SelectAllCheckbox
                    checked={isAllRowsSelected}
                    onCheckedChange={handleSelectAllToggle}
                  />
                  {displayColumns.map((column, idx) => (
                    <ColumnHeaderMenu
                      key={column.key}
                      column={column}
                      colIndex={idx}
                      readOnly={!userPermissions.canEdit}
                      isRenaming={columnRename.editingId === column.name}
                      isColumnSelected={
                        isColumnSelection &&
                        normalizedSelection !== null &&
                        idx >= normalizedSelection.startCol &&
                        idx <= normalizedSelection.endCol
                      }
                      renameValue={
                        columnRename.editingId === column.name ? columnRename.editValue : ''
                      }
                      onRenameValueChange={columnRename.setEditValue}
                      onRenameSubmit={columnRename.submitRename}
                      onRenameCancel={columnRename.cancelRename}
                      onColumnSelect={handleColumnSelect}
                      onChangeType={handleChangeType}
                      onInsertLeft={handleInsertColumnLeft}
                      onInsertRight={handleInsertColumnRight}
                      onDeleteColumn={handleDeleteColumn}
                      onResizeStart={handleColumnResizeStart}
                      onResize={handleColumnResize}
                      onResizeEnd={handleColumnResizeEnd}
                      onAutoResize={handleColumnAutoResize}
                      onDragStart={handleColumnDragStart}
                      onDragOver={handleColumnDragOver}
                      onDragEnd={handleColumnDragEnd}
                      onDragLeave={handleColumnDragLeave}
                      onOpenConfig={handleConfigureColumn}
                    />
                  ))}
                  {userPermissions.canEdit && (
                    <NewColumnDropdown
                      trigger='inline-header'
                      disabled={addColumnMutation.isPending}
                      onPickType={handleAddColumnOfType}
                    />
                  )}
                </tr>
              )}
            </thead>
            <tbody ref={tbodyRef}>
              {isLoadingTable || isLoadingRows ? (
                <TableBodySkeleton colCount={displayColCount} />
              ) : (
                (() => {
                  const virtualItems = rowVirtualizer.getVirtualItems()
                  const scrollMargin = rowVirtualizer.options.scrollMargin
                  const paddingTop =
                    virtualItems.length > 0 ? virtualItems[0].start - scrollMargin : 0
                  const paddingBottom =
                    virtualItems.length > 0
                      ? rowVirtualizer.getTotalSize() -
                        (virtualItems[virtualItems.length - 1].end - scrollMargin)
                      : 0
                  return (
                    <>
                      {paddingTop > 0 && (
                        <tr aria-hidden>
                          <td colSpan={displayColumns.length + 2} style={{ height: paddingTop }} />
                        </tr>
                      )}
                      {virtualItems.map((virtualRow) => {
                        const index = virtualRow.index
                        const row = rows[index]
                        if (!row) return null
                        return (
                          <DataRow
                            key={row.id}
                            row={row}
                            columns={displayColumns}
                            rowIndex={index}
                            isFirstRow={index === 0}
                            editingColumnName={
                              editingCell?.rowId === row.id ? editingCell.columnName : null
                            }
                            initialCharacter={
                              editingCell?.rowId === row.id ? initialCharacter : null
                            }
                            pendingCellValue={
                              pendingUpdate && pendingUpdate.rowId === row.id
                                ? pendingUpdate.data
                                : null
                            }
                            normalizedSelection={normalizedSelection}
                            onClick={handleCellClick}
                            onDoubleClick={handleCellDoubleClick}
                            onSave={handleInlineSave}
                            onCancel={handleInlineCancel}
                            onContextMenu={handleRowContextMenu}
                            onCellMouseDown={handleCellMouseDown}
                            onCellMouseEnter={handleCellMouseEnter}
                            isRowChecked={rowSelectionIncludes(rowSelection, row.id)}
                            onRowToggle={handleRowToggle}
                            numDivWidth={numDivWidth}
                          />
                        )
                      })}
                      {paddingBottom > 0 && (
                        <tr aria-hidden>
                          <td
                            colSpan={displayColumns.length + 2}
                            style={{ height: paddingBottom }}
                          />
                        </tr>
                      )}
                    </>
                  )
                })()
              )}
            </tbody>
          </table>
          {resizingColumn && (
            <div
              className='-translate-x-[1.5px] pointer-events-none absolute top-0 z-20 h-full w-[2px] bg-primary'
              style={{ left: resizeIndicatorLeft }}
            />
          )}
          {dropColumnBounds !== null && (
            <>
              <div
                className={cn(
                  'pointer-events-none absolute top-0 z-[15] h-full',
                  SELECTION_TINT_BG
                )}
                style={{ left: dropColumnBounds.left, width: dropColumnBounds.width }}
              />
              <div
                className='-translate-x-[1px] pointer-events-none absolute top-0 z-20 h-full w-[2px] bg-primary'
                style={{ left: dropColumnBounds.lineLeft }}
              />
            </>
          )}
        </div>
        {!isLoadingTable && !isLoadingRows && userPermissions.canEdit && (
          <AddRowButton onClick={handleAppendRow} />
        )}
      </div>

      <ContextMenu
        contextMenu={contextMenu}
        onClose={closeContextMenu}
        onEditCell={handleContextMenuEditCell}
        onDelete={handleContextMenuDelete}
        onInsertAbove={handleInsertRowAbove}
        onInsertBelow={handleInsertRowBelow}
        onDuplicate={handleDuplicateRow}
        selectedRowCount={selectedRowCount}
        disableEdit={!userPermissions.canEdit}
        disableInsert={!userPermissions.canEdit}
        disableDelete={!userPermissions.canEdit}
      />

      <ExpandedCellPopover
        expandedCell={expandedCell}
        onClose={() => setExpandedCell(null)}
        rows={rows}
        columns={displayColumns}
        onSave={handleInlineSave}
        canEdit={userPermissions.canEdit}
        scrollContainer={scrollRef.current}
      />
    </div>
  )
}
