'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ContextMenuState } from '../../types'

export interface ContextMenuProps {
  contextMenu: ContextMenuState
  onClose: () => void
  onEditCell: () => void
  onDelete: () => void
  onInsertAbove: () => void
  onInsertBelow: () => void
  onDuplicate: () => void
  selectedRowCount?: number
  disableEdit?: boolean
  disableInsert?: boolean
  disableDelete?: boolean
}

/**
 * Right-click context menu for table rows.
 * Rendered as a fixed 1×1 invisible trigger div at the pointer position
 * so the DropdownMenu aligns to the cursor.
 */
export function ContextMenu({
  contextMenu,
  onClose,
  onEditCell,
  onDelete,
  onInsertAbove,
  onInsertBelow,
  onDuplicate,
  selectedRowCount = 1,
  disableEdit = false,
  disableInsert = false,
  disableDelete = false,
}: ContextMenuProps) {
  const deleteLabel =
    selectedRowCount > 1 ? `Delete ${selectedRowCount} rows` : 'Delete row'

  return (
    <DropdownMenu
      modal={false}
      open={contextMenu.isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DropdownMenuTrigger asChild>
        {/* Invisible 1×1 trigger positioned at cursor */}
        <div
          style={{
            position: 'fixed',
            top: contextMenu.position.y,
            left: contextMenu.position.x,
            width: 1,
            height: 1,
            pointerEvents: 'none',
          }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start'>
        {contextMenu.columnName && (
          <DropdownMenuItem
            disabled={disableEdit}
            onSelect={() => {
              onClose()
              onEditCell()
            }}
          >
            Edit cell
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          disabled={disableInsert}
          onSelect={() => {
            onClose()
            onInsertAbove()
          }}
        >
          Insert row above
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={disableInsert}
          onSelect={() => {
            onClose()
            onInsertBelow()
          }}
        >
          Insert row below
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={selectedRowCount > 1}
          onSelect={() => {
            onClose()
            onDuplicate()
          }}
        >
          Duplicate row
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={disableDelete}
          className='text-destructive focus:text-destructive'
          onSelect={() => {
            onClose()
            onDelete()
          }}
        >
          {deleteLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
