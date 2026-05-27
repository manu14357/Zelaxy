'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ColumnDefinition } from '@/lib/table'
import { cn } from '@/lib/utils'
import { COLUMN_TYPE_OPTIONS } from '../column-config-sidebar'

const CELL_HEADER =
  'border-border border-r border-b bg-background px-2 py-[7px] text-left align-middle'

interface NewColumnDropdownProps {
  trigger: 'header' | 'inline-header'
  disabled: boolean
  onPickType: (type: ColumnDefinition['type']) => void
}

/**
 * Dropdown that lets the user pick a column type to add.
 * `trigger='inline-header'` wraps the component in a <th> so it slots
 * directly into the table's header row.
 * `trigger='header'` renders a standalone button (used in the page header).
 */
export function NewColumnDropdown({ trigger, disabled, onPickType }: NewColumnDropdownProps) {
  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger === 'inline-header' ? (
          <button
            disabled={disabled}
            className={cn(
              'flex h-full w-full items-center gap-1 text-muted-foreground text-xs hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <Plus className='size-3' />
            <span>Add column</span>
          </button>
        ) : (
          <Button variant='outline' size='sm' disabled={disabled}>
            <Plus className='mr-1 size-3.5' />
            Add column
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start'>
        {COLUMN_TYPE_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.type}
            onSelect={() => onPickType(opt.type as ColumnDefinition['type'])}
          >
            <opt.icon className='mr-2 size-3.5' />
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (trigger === 'inline-header') {
    return <th className={CELL_HEADER}>{menu}</th>
  }

  return menu
}
