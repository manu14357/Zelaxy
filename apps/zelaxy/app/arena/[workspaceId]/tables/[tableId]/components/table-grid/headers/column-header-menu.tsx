'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronDown, Pencil, Trash } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ColumnDefinition } from '@/lib/table'
import { cn } from '@/lib/utils'
import { COL_WIDTH, SELECTION_TINT_BG } from '../constants'
import type { DisplayColumn } from '../types'
import { ColumnTypeIcon } from './column-type-icon'

interface ColumnOptionsMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  position: { x: number; y: number }
  column: DisplayColumn
  onOpenConfig: (columnName: string) => void
  onInsertLeft: (columnName: string) => void
  onInsertRight: (columnName: string) => void
  onDeleteColumn: (columnName: string) => void
}

function ColumnOptionsMenu({
  open,
  onOpenChange,
  position,
  column,
  onOpenConfig,
  onInsertLeft,
  onInsertRight,
  onDeleteColumn,
}: ColumnOptionsMenuProps) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <div
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: '1px',
            height: '1px',
            pointerEvents: 'none',
          }}
          tabIndex={-1}
          aria-hidden='true'
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='start'
        side='bottom'
        sideOffset={4}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuItem onSelect={() => onOpenConfig(column.name)}>
          <Pencil className='mr-2 size-3.5' />
          Edit column
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onInsertLeft(column.name)}>
          <ArrowLeft className='mr-2 size-3.5' />
          Insert column left
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onInsertRight(column.name)}>
          <ArrowRight className='mr-2 size-3.5' />
          Insert column right
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className='text-destructive focus:text-destructive'
          onSelect={() => onDeleteColumn(column.name)}
        >
          <Trash className='mr-2 size-3.5' />
          Delete column
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface ColumnHeaderMenuProps {
  column: DisplayColumn
  colIndex: number
  readOnly?: boolean
  isRenaming: boolean
  isColumnSelected: boolean
  renameValue: string
  onRenameValueChange: (value: string) => void
  onRenameSubmit: () => void
  onRenameCancel: () => void
  onColumnSelect: (colIndex: number, shiftKey: boolean) => void
  onChangeType: (columnName: string, newType: ColumnDefinition['type']) => void
  onInsertLeft: (columnName: string) => void
  onInsertRight: (columnName: string) => void
  onDeleteColumn: (columnName: string) => void
  onResizeStart: (columnKey: string) => void
  onResize: (columnKey: string, width: number) => void
  onResizeEnd: () => void
  onAutoResize: (columnKey: string) => void
  onDragStart?: (columnName: string) => void
  onDragOver?: (columnName: string, side: 'left' | 'right') => void
  onDragEnd?: () => void
  onDragLeave?: () => void
  onOpenConfig: (columnName: string) => void
}

export const ColumnHeaderMenu = React.memo(function ColumnHeaderMenu({
  column,
  colIndex,
  readOnly,
  isRenaming,
  isColumnSelected,
  renameValue,
  onRenameValueChange,
  onRenameSubmit,
  onRenameCancel,
  onColumnSelect,
  onInsertLeft,
  onInsertRight,
  onDeleteColumn,
  onResizeStart,
  onResize,
  onResizeEnd,
  onAutoResize,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDragLeave,
  onOpenConfig,
}: ColumnHeaderMenuProps) {
  const renameInputRef = useRef<HTMLInputElement>(null)
  const didDragRef = useRef(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [isRenaming])

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const startX = e.clientX
      const th = (e.currentTarget as HTMLElement).closest('th')
      const startWidth = th ? th.getBoundingClientRect().width : COL_WIDTH
      const target = e.currentTarget as HTMLElement
      target.setPointerCapture(e.pointerId)
      onResizeStart(column.key)
      const handlePointerMove = (ev: PointerEvent) => {
        onResize(column.key, startWidth + (ev.clientX - startX))
      }
      const cleanup = () => {
        target.removeEventListener('pointermove', handlePointerMove)
        target.removeEventListener('pointerup', cleanup)
        target.removeEventListener('pointercancel', cleanup)
        onResizeEnd()
      }
      target.addEventListener('pointermove', handlePointerMove)
      target.addEventListener('pointerup', cleanup)
      target.addEventListener('pointercancel', cleanup)
    },
    [column.key, onResizeStart, onResize, onResizeEnd]
  )

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (readOnly || isRenaming) {
        e.preventDefault()
        return
      }
      didDragRef.current = true
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', column.name)
      const ghost = document.createElement('div')
      ghost.textContent = column.name
      ghost.style.cssText =
        'position:absolute;top:-9999px;padding:4px 8px;background:var(--background);border:1px solid var(--border);border-radius:4px;font-size:13px;font-weight:500;white-space:nowrap'
      document.body.appendChild(ghost)
      e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2)
      requestAnimationFrame(() => ghost.parentNode?.removeChild(ghost))
      onDragStart?.(column.name)
    },
    [column.name, readOnly, isRenaming, onDragStart]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const midX = rect.left + rect.width / 2
      const side = e.clientX < midX ? 'left' : 'right'
      onDragOver?.(column.name, side)
    },
    [column.name, onDragOver]
  )

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      const th = e.currentTarget as HTMLElement
      const related = e.relatedTarget as Node | null
      if (related && th.contains(related)) return
      if (related && related instanceof Element && related.closest('th')) return
      onDragLeave?.()
    },
    [onDragLeave]
  )

  function handleHeaderClick(e: React.MouseEvent) {
    if (didDragRef.current) {
      didDragRef.current = false
      return
    }
    if (isRenaming) return
    onColumnSelect(colIndex, e.shiftKey)
    if (!e.shiftKey) onOpenConfig(column.name)
  }

  function handleChevronClick(e: React.MouseEvent) {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).closest('th')?.getBoundingClientRect()
    if (rect) setMenuPosition({ x: rect.left, y: rect.bottom })
    setMenuOpen(true)
  }

  function handleContextMenu(e: React.MouseEvent) {
    if (readOnly || isRenaming) return
    e.preventDefault()
    setMenuPosition({ x: e.clientX, y: e.clientY })
    setMenuOpen(true)
  }

  return (
    <th
      className='group relative border-border border-r border-b bg-background p-0 text-left align-middle'
      draggable={!readOnly && !isRenaming}
      onDragStart={handleDragStart}
      onDragEnd={() => {
        didDragRef.current = false
        onDragEnd?.()
      }}
      onDragOver={handleDragOver}
      onDrop={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onContextMenu={handleContextMenu}
    >
      {isColumnSelected && (
        <div
          className={cn('pointer-events-none absolute inset-0', SELECTION_TINT_BG)}
          aria-hidden='true'
        />
      )}
      {isRenaming ? (
        <div className='flex h-full w-full min-w-0 items-center px-2 py-[7px]'>
          <ColumnTypeIcon type={column.type} />
          <input
            ref={renameInputRef}
            type='text'
            value={renameValue}
            onChange={(e) => onRenameValueChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRenameSubmit()
              if (e.key === 'Escape') onRenameCancel()
            }}
            onBlur={onRenameSubmit}
            className='ml-1.5 min-w-0 flex-1 border-0 bg-transparent p-0 font-medium text-[13px] text-foreground outline-none focus:outline-none focus:ring-0'
          />
        </div>
      ) : readOnly ? (
        <div className='flex h-full w-full min-w-0 items-center px-2 py-[7px]'>
          <ColumnTypeIcon type={column.type} />
          <span className='ml-1.5 min-w-0 overflow-clip text-ellipsis whitespace-nowrap font-medium text-[13px] text-foreground'>
            {column.name}
          </span>
        </div>
      ) : (
        <div className='flex h-full w-full min-w-0 items-center'>
          <button
            type='button'
            className='flex min-w-0 flex-1 cursor-pointer items-center px-2 py-[7px] outline-none'
            onClick={handleHeaderClick}
            draggable={false}
          >
            <ColumnTypeIcon type={column.type} />
            <span className='ml-1.5 min-w-0 overflow-clip text-ellipsis whitespace-nowrap font-medium text-[13px] text-foreground'>
              {column.name}
            </span>
          </button>
          <button
            type='button'
            className='flex h-full shrink-0 cursor-pointer items-center pr-2.5 pl-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100'
            onClick={handleChevronClick}
            draggable={false}
            aria-label='Column options'
          >
            <ChevronDown className='size-[14px] shrink-0' />
          </button>
          <ColumnOptionsMenu
            open={menuOpen}
            onOpenChange={setMenuOpen}
            position={menuPosition}
            column={column}
            onOpenConfig={onOpenConfig}
            onInsertLeft={onInsertLeft}
            onInsertRight={onInsertRight}
            onDeleteColumn={onDeleteColumn}
          />
        </div>
      )}
      <div
        className='-right-[3px] absolute top-0 z-[1] h-full w-[6px] cursor-col-resize'
        draggable={false}
        onDragStart={(e) => e.stopPropagation()}
        onPointerDown={handleResizePointerDown}
        onDoubleClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onAutoResize(column.key)
        }}
      />
    </th>
  )
})
