'use client'

import type React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { storageToDisplay } from '../../../utils'
import type { DisplayColumn } from '../types'

export type CellRenderKind =
  | { kind: 'boolean'; checked: boolean }
  | { kind: 'json'; text: string }
  | { kind: 'date'; text: string }
  | { kind: 'url'; text: string; href: string }
  | { kind: 'text'; text: string }
  | { kind: 'empty' }

interface ResolveCellRenderInput {
  value: unknown
  column: DisplayColumn
}

export function resolveCellRender({ value, column }: ResolveCellRenderInput): CellRenderKind {
  const isNull = value === null || value === undefined

  if (column.type === 'boolean') return { kind: 'boolean', checked: Boolean(value) }
  if (isNull) return { kind: 'empty' }
  if (column.type === 'json') return { kind: 'json', text: JSON.stringify(value) }
  if (column.type === 'date') return { kind: 'date', text: String(value) }
  if (column.type === 'string') {
    const text = stringifyValue(value)
    if (/^https?:\/\//i.test(text.trim())) {
      try {
        new URL(text.trim())
        return { kind: 'url', text, href: text.trim() }
      } catch {
        /* not a URL */
      }
    }
    return { kind: 'text', text }
  }
  return { kind: 'text', text: stringifyValue(value) }
}

function stringifyValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  return JSON.stringify(value)
}

interface CellRenderProps {
  kind: CellRenderKind
  isEditing: boolean
}

export function CellRender({ kind, isEditing }: CellRenderProps): React.ReactElement | null {
  switch (kind.kind) {
    case 'boolean':
      return (
        <div
          data-boolean-cell-toggle
          className={cn(
            'flex min-h-[20px] w-full items-center justify-center',
            isEditing && 'invisible'
          )}
        >
          <Checkbox checked={kind.checked} className='pointer-events-none h-3.5 w-3.5' />
        </div>
      )

    case 'json':
      return (
        <span
          className={cn(
            'block overflow-clip text-ellipsis text-foreground',
            isEditing && 'invisible'
          )}
        >
          {kind.text}
        </span>
      )

    case 'date':
      return (
        <span className={cn('text-foreground', isEditing && 'invisible')}>
          {storageToDisplay(kind.text)}
        </span>
      )

    case 'url':
      return (
        <a
          href={kind.href}
          target='_blank'
          rel='noopener noreferrer'
          className={cn(
            'min-w-0 overflow-clip text-ellipsis text-foreground underline underline-offset-2 hover:opacity-70',
            isEditing && 'pointer-events-none invisible'
          )}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          {kind.text}
        </a>
      )

    case 'text':
      return (
        <span
          className={cn(
            'block overflow-clip text-ellipsis text-foreground',
            isEditing && 'invisible'
          )}
        >
          {kind.text}
        </span>
      )

    case 'empty':
      return null

    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}
