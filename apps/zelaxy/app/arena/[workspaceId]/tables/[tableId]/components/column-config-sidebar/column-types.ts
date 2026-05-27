import type React from 'react'
import { Braces, Calendar, Hash, ToggleLeft, Type } from 'lucide-react'
import type { ColumnDefinition } from '@/lib/table'

export type SidebarColumnType = ColumnDefinition['type']

export interface ColumnTypeOption {
  type: SidebarColumnType
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export const COLUMN_TYPE_OPTIONS: ColumnTypeOption[] = [
  { type: 'string', label: 'Text', icon: Type },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'boolean', label: 'Boolean', icon: ToggleLeft },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'json', label: 'JSON', icon: Braces },
]

/** Plain column types (no workflow). Used by <ColumnConfigSidebar>'s type selector. */
export const PLAIN_COLUMN_TYPE_OPTIONS = COLUMN_TYPE_OPTIONS
