'use client'

import { Calendar, Braces, Hash, ToggleLeft, Type } from 'lucide-react'
import type { ColumnDefinition } from '@/lib/table'

export const COLUMN_TYPE_ICONS: Record<string, React.ElementType> = {
  string: Type,
  number: Hash,
  boolean: ToggleLeft,
  date: Calendar,
  json: Braces,
}

interface ColumnTypeIconProps {
  type: ColumnDefinition['type']
}

export function ColumnTypeIcon({ type }: ColumnTypeIconProps) {
  const Icon = COLUMN_TYPE_ICONS[type] ?? Type
  return <Icon className='size-3 shrink-0 text-muted-foreground' />
}
