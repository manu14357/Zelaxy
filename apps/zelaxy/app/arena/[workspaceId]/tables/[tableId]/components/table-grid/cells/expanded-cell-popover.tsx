'use client'

import type React from 'react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { TableRow as TableRowType } from '@/lib/table'
import type { EditingCell, SaveReason } from '../../../types'
import { cleanCellValue, displayToStorage, formatValueForInput } from '../../../utils'
import type { DisplayColumn } from '../types'

interface ExpandedCellPopoverProps {
  expandedCell: EditingCell | null
  onClose: () => void
  rows: TableRowType[]
  columns: DisplayColumn[]
  onSave: (rowId: string, columnName: string, value: unknown, reason: SaveReason) => void
  canEdit: boolean
  scrollContainer: HTMLElement | null
}

const EXPANDED_CELL_MIN_WIDTH = 420
const EXPANDED_CELL_HEIGHT = 280

export function ExpandedCellPopover({
  expandedCell,
  onClose,
  rows,
  columns,
  onSave,
  canEdit,
  scrollContainer,
}: ExpandedCellPopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const [draftValue, setDraftValue] = useState<string>('')

  const target = useMemo(() => {
    if (!expandedCell) return null
    const row = rows.find((r) => r.id === expandedCell.rowId)
    const matchByKey = expandedCell.columnKey
      ? (c: DisplayColumn) => c.key === expandedCell.columnKey
      : (c: DisplayColumn) => c.name === expandedCell.columnName
    const column = columns.find(matchByKey)
    if (!row || !column) return null
    const colIndex = columns.findIndex(matchByKey)
    return { row, column, colIndex, value: row.data[column.name] }
  }, [expandedCell, rows, columns])

  const isBooleanCell = target?.column.type === 'boolean'
  const isEditable = Boolean(target) && canEdit && !isBooleanCell

  const displayText = useMemo(() => {
    if (!target) return ''
    const { value } = target
    if (value == null) return ''
    if (typeof value === 'string') return value
    return JSON.stringify(value, null, 2)
  }, [target])

  useLayoutEffect(() => {
    if (!expandedCell || !target) {
      setRect(null)
      return
    }
    setDraftValue(isEditable ? formatValueForInput(target.value, target.column.type) : '')
    const selector = `[data-table-scroll] [data-row-id="${target.row.id}"][data-col="${target.colIndex}"]`
    const el = document.querySelector<HTMLElement>(selector)
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width })
    requestAnimationFrame(() => textareaRef.current?.focus())
  }, [expandedCell, target, isEditable])

  useEffect(() => {
    if (!expandedCell) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    const handleMouseDown = (e: MouseEvent) => {
      if (!rootRef.current) return
      if (rootRef.current.contains(e.target as Node)) return
      onClose()
    }
    window.addEventListener('keydown', handleKey)
    window.addEventListener('mousedown', handleMouseDown)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('mousedown', handleMouseDown)
    }
  }, [expandedCell, onClose])

  useEffect(() => {
    if (!expandedCell || !scrollContainer) return
    const handler = () => onClose()
    scrollContainer.addEventListener('scroll', handler, { passive: true })
    return () => scrollContainer.removeEventListener('scroll', handler)
  }, [expandedCell, scrollContainer, onClose])

  if (!expandedCell || !target || !rect) return null

  const width = Math.max(rect.width, EXPANDED_CELL_MIN_WIDTH)
  const VIEWPORT_PAD = 8
  const cellRight = rect.left + rect.width
  const overflowsRight = rect.left + width > window.innerWidth - VIEWPORT_PAD
  const left = overflowsRight
    ? Math.max(VIEWPORT_PAD, cellRight - width)
    : Math.max(VIEWPORT_PAD, rect.left)
  const overflowsBottom = rect.top + EXPANDED_CELL_HEIGHT > window.innerHeight - VIEWPORT_PAD
  const top = overflowsBottom
    ? Math.max(VIEWPORT_PAD, window.innerHeight - EXPANDED_CELL_HEIGHT - VIEWPORT_PAD)
    : rect.top

  const handleSave = () => {
    if (!isEditable) return
    const raw = displayToStorage(draftValue) ?? draftValue
    const cleaned = cleanCellValue(raw, target.column)
    onSave(target.row.id, target.column.name, cleaned, 'blur')
    onClose()
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <div
      ref={rootRef}
      role='dialog'
      aria-label={`Expanded view of ${target.column.name}`}
      className='fixed z-50 flex flex-col overflow-hidden rounded-md border border-border bg-background shadow-md'
      style={{ top, left, width, height: EXPANDED_CELL_HEIGHT }}
    >
      {isEditable ? (
        <>
          <textarea
            ref={textareaRef}
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            className='min-h-0 flex-1 resize-none bg-transparent px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground'
            spellCheck={false}
            autoCorrect='off'
          />
          <div className='flex items-center justify-between border-t border-border bg-muted/30 px-2 py-1.5'>
            <span className='text-xs text-muted-foreground'>
              <kbd className='font-mono'>↵</kbd> save · <kbd className='font-mono'>esc</kbd> cancel
            </span>
            <div className='flex items-center gap-1.5'>
              <Button variant='ghost' size='sm' onClick={onClose}>Cancel</Button>
              <Button size='sm' onClick={handleSave}>Save</Button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className='min-h-0 flex-1 overflow-auto px-2.5 py-2'>
            {displayText ? (
              <pre className='whitespace-pre-wrap break-words text-sm text-foreground'>
                {displayText}
              </pre>
            ) : (
              <span className='text-sm text-muted-foreground'>(empty)</span>
            )}
          </div>
          <div className='flex items-center justify-end border-t border-border bg-muted/30 px-2 py-1.5'>
            <Button variant='ghost' size='sm' onClick={onClose}>Close</Button>
          </div>
        </>
      )}
    </div>
  )
}
