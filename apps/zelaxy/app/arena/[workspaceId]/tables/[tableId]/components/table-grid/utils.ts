import type { ColumnDefinition, TableRow as TableRowType } from '@/lib/table'
import type { DeletedRowSnapshot } from '@/stores/table/types'
import type { DisplayColumn } from './types'

export type RowSelection = { kind: 'none' } | { kind: 'some'; ids: Set<string> } | { kind: 'all' }

export const ROW_SELECTION_NONE: RowSelection = { kind: 'none' }
export const ROW_SELECTION_ALL: RowSelection = { kind: 'all' }

export function rowSelectionIncludes(sel: RowSelection, id: string): boolean {
  if (sel.kind === 'all') return true
  if (sel.kind === 'some') return sel.ids.has(id)
  return false
}

export function rowSelectionIsEmpty(sel: RowSelection): boolean {
  if (sel.kind === 'none') return true
  if (sel.kind === 'some') return sel.ids.size === 0
  return false
}

export function rowSelectionMaterialize(sel: RowSelection, rows: TableRowType[]): Set<string> {
  if (sel.kind === 'all') return new Set(rows.map((r) => r.id))
  if (sel.kind === 'some') return new Set(sel.ids)
  return new Set<string>()
}

export function rowSelectionCoversAll(sel: RowSelection, rows: TableRowType[]): boolean {
  if (rows.length === 0) return false
  if (sel.kind === 'all') return true
  if (sel.kind === 'none') return false
  if (sel.ids.size < rows.length) return false
  for (const r of rows) if (!sel.ids.has(r.id)) return false
  return true
}

/** Returns sticky row-number column dimensions sized to the digit count of `maxRows`. */
export function checkboxColLayout(maxRows: number): { colWidth: number; numDivWidth: number } {
  const digits = maxRows > 0 ? Math.floor(Math.log10(maxRows)) + 1 : 1
  const numDivWidth = Math.max(20, digits * 8 + 4)
  const colWidth = Math.max(32, numDivWidth + 8)
  return { colWidth, numDivWidth }
}

export interface CellCoord {
  rowIndex: number
  colIndex: number
}

export interface NormalizedSelection {
  startRow: number
  endRow: number
  startCol: number
  endCol: number
  anchorRow: number
  anchorCol: number
}

/**
 * Flat schema → one DisplayColumn per ColumnDefinition.
 */
export function expandToDisplayColumns(columns: ColumnDefinition[]): DisplayColumn[] {
  return columns.map((col) => ({ ...col, key: col.name }))
}

export function moveCell(
  anchor: CellCoord,
  colCount: number,
  totalRows: number,
  direction: 1 | -1
): CellCoord {
  let newCol = anchor.colIndex + direction
  let newRow = anchor.rowIndex
  if (newCol >= colCount) {
    newCol = 0
    newRow = Math.min(totalRows - 1, newRow + 1)
  } else if (newCol < 0) {
    newCol = colCount - 1
    newRow = Math.max(0, newRow - 1)
  }
  return { rowIndex: newRow, colIndex: newCol }
}

export function computeNormalizedSelection(
  anchor: CellCoord | null,
  focus: CellCoord | null
): NormalizedSelection | null {
  if (!anchor) return null
  const f = focus ?? anchor
  return {
    startRow: Math.min(anchor.rowIndex, f.rowIndex),
    endRow: Math.max(anchor.rowIndex, f.rowIndex),
    startCol: Math.min(anchor.colIndex, f.colIndex),
    endCol: Math.max(anchor.colIndex, f.colIndex),
    anchorRow: anchor.rowIndex,
    anchorCol: anchor.colIndex,
  }
}

export function collectRowSnapshots(rows: Iterable<TableRowType>): DeletedRowSnapshot[] {
  const snapshots: DeletedRowSnapshot[] = []
  for (const row of rows) {
    snapshots.push({ rowId: row.id, data: { ...row.data }, position: row.position })
  }
  return snapshots
}
