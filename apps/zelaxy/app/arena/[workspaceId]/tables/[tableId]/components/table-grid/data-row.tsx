'use client'

import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import type { TableRow as TableRowType } from '@/lib/table'
import { cn } from '@/lib/utils'
import type { SaveReason } from '../../types'
import { CellContent } from './cells'
import {
  CELL,
  CELL_CHECKBOX,
  CELL_CONTENT,
  SELECTION_OVERLAY,
  SELECTION_TINT_BG,
} from './constants'
import type { DisplayColumn } from './types'
import type { NormalizedSelection } from './utils'

export interface DataRowProps {
  row: TableRowType
  columns: DisplayColumn[]
  rowIndex: number
  isFirstRow: boolean
  editingColumnName: string | null
  initialCharacter: string | null
  pendingCellValue: Record<string, unknown> | null
  normalizedSelection: NormalizedSelection | null
  onClick: (rowId: string, columnName: string, options?: { toggleBoolean?: boolean }) => void
  onDoubleClick: (rowId: string, columnName: string, columnKey: string) => void
  onSave: (rowId: string, columnName: string, value: unknown, reason: SaveReason) => void
  onCancel: () => void
  onContextMenu: (e: React.MouseEvent, row: TableRowType) => void
  onCellMouseDown: (rowIndex: number, colIndex: number, shiftKey: boolean) => void
  onCellMouseEnter: (rowIndex: number, colIndex: number) => void
  isRowChecked: boolean
  onRowToggle: (rowIndex: number, shiftKey: boolean) => void
  numDivWidth: number
}

function cellRangeRowChanged(
  rowIndex: number,
  colCount: number,
  prev: NormalizedSelection | null,
  next: NormalizedSelection | null
): boolean {
  const pIn = prev !== null && rowIndex >= prev.startRow && rowIndex <= prev.endRow
  const nIn = next !== null && rowIndex >= next.startRow && rowIndex <= next.endRow
  const pAnchor = prev !== null && rowIndex === prev.anchorRow
  const nAnchor = next !== null && rowIndex === next.anchorRow

  if (!pIn && !nIn && !pAnchor && !nAnchor) return false
  if (pIn !== nIn || pAnchor !== nAnchor) return true

  if (pIn && nIn) {
    if (prev!.startCol !== next!.startCol || prev!.endCol !== next!.endCol) return true
    if ((rowIndex === prev!.startRow) !== (rowIndex === next!.startRow)) return true
    if ((rowIndex === prev!.endRow) !== (rowIndex === next!.endRow)) return true
    const pMulti = prev!.startRow !== prev!.endRow || prev!.startCol !== prev!.endCol
    const nMulti = next!.startRow !== next!.endRow || next!.startCol !== next!.endCol
    if (pMulti !== nMulti) return true
    const pFull = prev!.startCol === 0 && prev!.endCol === colCount - 1
    const nFull = next!.startCol === 0 && next!.endCol === colCount - 1
    if (pFull !== nFull) return true
  }

  if (pAnchor && nAnchor && prev!.anchorCol !== next!.anchorCol) return true
  return false
}

function dataRowPropsAreEqual(prev: DataRowProps, next: DataRowProps): boolean {
  if (
    prev.row !== next.row ||
    prev.columns !== next.columns ||
    prev.rowIndex !== next.rowIndex ||
    prev.isFirstRow !== next.isFirstRow ||
    prev.editingColumnName !== next.editingColumnName ||
    prev.pendingCellValue !== next.pendingCellValue ||
    prev.onClick !== next.onClick ||
    prev.onDoubleClick !== next.onDoubleClick ||
    prev.onSave !== next.onSave ||
    prev.onCancel !== next.onCancel ||
    prev.onContextMenu !== next.onContextMenu ||
    prev.onCellMouseDown !== next.onCellMouseDown ||
    prev.onCellMouseEnter !== next.onCellMouseEnter ||
    prev.isRowChecked !== next.isRowChecked ||
    prev.onRowToggle !== next.onRowToggle ||
    prev.numDivWidth !== next.numDivWidth
  ) {
    return false
  }
  if (
    (prev.editingColumnName !== null || next.editingColumnName !== null) &&
    prev.initialCharacter !== next.initialCharacter
  ) {
    return false
  }
  return !cellRangeRowChanged(
    prev.rowIndex,
    prev.columns.length,
    prev.normalizedSelection,
    next.normalizedSelection
  )
}

export const DataRow = React.memo(function DataRow({
  row,
  columns,
  rowIndex,
  isFirstRow,
  editingColumnName,
  initialCharacter,
  pendingCellValue,
  normalizedSelection,
  isRowChecked,
  onClick,
  onDoubleClick,
  onSave,
  onCancel,
  onContextMenu,
  onCellMouseDown,
  onCellMouseEnter,
  onRowToggle,
  numDivWidth,
}: DataRowProps) {
  const sel = normalizedSelection
  const isMultiCell = sel !== null && (sel.startRow !== sel.endRow || sel.startCol !== sel.endCol)

  return (
    <tr onContextMenu={(e) => onContextMenu(e, row)}>
      <td className={cn(CELL_CHECKBOX, 'cursor-pointer')}>
        <div className='flex items-center justify-center'>
          <div
            role='checkbox'
            tabIndex={0}
            aria-checked={isRowChecked}
            aria-label={`Select row ${rowIndex + 1}`}
            className='group/checkbox flex h-[20px] shrink-0 items-center justify-center'
            style={{ width: numDivWidth }}
            onMouseDown={(e) => {
              if (e.button !== 0) return
              onRowToggle(rowIndex, e.shiftKey)
            }}
            onKeyDown={(e) => {
              if (e.key !== ' ' && e.key !== 'Enter') return
              e.preventDefault()
              onRowToggle(rowIndex, e.shiftKey)
            }}
          >
            <span
              className={cn(
                'text-center text-muted-foreground text-xs tabular-nums',
                isRowChecked ? 'hidden' : 'block group-hover/checkbox:hidden'
              )}
            >
              {rowIndex + 1}
            </span>
            <div
              className={cn(
                'items-center justify-center',
                isRowChecked ? 'flex' : 'hidden group-hover/checkbox:flex'
              )}
            >
              <Checkbox checked={isRowChecked} className='pointer-events-none h-3.5 w-3.5' />
            </div>
          </div>
        </div>
      </td>
      {columns.map((column, colIndex) => {
        const inRange =
          sel !== null &&
          rowIndex >= sel.startRow &&
          rowIndex <= sel.endRow &&
          colIndex >= sel.startCol &&
          colIndex <= sel.endCol
        const isAnchor = sel !== null && rowIndex === sel.anchorRow && colIndex === sel.anchorCol
        const isEditing = editingColumnName === column.name
        const isHighlighted = inRange || isRowChecked

        const isTopEdge = inRange ? rowIndex === sel!.startRow : isRowChecked
        const isBottomEdge = inRange ? rowIndex === sel!.endRow : isRowChecked
        const isLeftEdge = inRange ? colIndex === sel!.startCol : colIndex === 0
        const isRightEdge = inRange ? colIndex === sel!.endCol : colIndex === columns.length - 1

        return (
          <td
            key={column.key}
            data-row={rowIndex}
            data-row-id={row.id}
            data-col={colIndex}
            className={cn(CELL, (isHighlighted || isAnchor || isEditing) && 'relative')}
            onMouseDown={(e) => {
              if (e.button !== 0 || isEditing) return
              onCellMouseDown(rowIndex, colIndex, e.shiftKey)
            }}
            onMouseEnter={() => onCellMouseEnter(rowIndex, colIndex)}
            onClick={(e) =>
              onClick(row.id, column.name, {
                toggleBoolean:
                  !e.shiftKey &&
                  Boolean((e.target as HTMLElement).closest('[data-boolean-cell-toggle]')),
              })
            }
            onDoubleClick={() => onDoubleClick(row.id, column.name, column.key)}
          >
            {isHighlighted && (isMultiCell || isRowChecked) && (
              <div
                className={cn(
                  '-top-px -right-px -bottom-px pointer-events-none absolute z-[4]',
                  colIndex === 0 ? 'left-0' : '-left-px',
                  SELECTION_TINT_BG,
                  isFirstRow && isTopEdge && 'top-0',
                  isTopEdge && 'border-t border-t-primary',
                  isBottomEdge && 'border-b border-b-primary',
                  isLeftEdge && 'border-l border-l-primary',
                  isRightEdge && 'border-r border-r-primary'
                )}
              />
            )}
            {isAnchor && (
              <div
                className={cn(
                  SELECTION_OVERLAY,
                  colIndex === 0 ? 'left-0' : '-left-px',
                  isFirstRow && 'top-0'
                )}
              />
            )}
            <div className={CELL_CONTENT}>
              <CellContent
                value={
                  pendingCellValue && column.name in pendingCellValue
                    ? pendingCellValue[column.name]
                    : row.data[column.name]
                }
                column={column}
                isEditing={isEditing}
                initialCharacter={isEditing ? initialCharacter : undefined}
                onSave={(value, reason) => onSave(row.id, column.name, value, reason)}
                onCancel={onCancel}
              />
            </div>
          </td>
        )
      })}
    </tr>
  )
}, dataRowPropsAreEqual)
