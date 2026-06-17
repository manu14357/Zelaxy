'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ColumnDefinition } from '@/lib/table'
import { cn } from '@/lib/utils'
import type { SaveReason } from '../../../types'
import {
  cleanCellValue,
  displayToStorage,
  formatValueForInput,
  storageToDisplay,
} from '../../../utils'

interface InlineEditorProps {
  value: unknown
  column: ColumnDefinition
  initialCharacter?: string
  onSave: (value: unknown, reason: SaveReason) => void
  onCancel: () => void
}

/** Inline editor for `date` columns — text input overlaying a native date picker. */
function InlineDateEditor({
  value,
  column,
  initialCharacter,
  onSave,
  onCancel,
}: InlineEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const doneRef = useRef(false)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const storedValue = formatValueForInput(value, column.type)
  const [draft, setDraft] = useState(() =>
    initialCharacter !== undefined ? initialCharacter : storageToDisplay(storedValue)
  )

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.focus()
    if (initialCharacter !== undefined) {
      const len = input.value.length
      input.setSelectionRange(len, len)
    } else {
      input.select()
    }
  }, [])

  useEffect(() => () => clearTimeout(blurTimeoutRef.current), [])

  const doSave = useCallback(
    (reason: SaveReason, storageVal?: string) => {
      if (doneRef.current) return
      doneRef.current = true
      clearTimeout(blurTimeoutRef.current)
      const raw = storageVal ?? displayToStorage(draft) ?? draft
      const val = raw && !Number.isNaN(Date.parse(raw)) ? raw : null
      onSave(val, reason)
    },
    [draft, onSave]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        doSave('enter')
      } else if (e.key === 'Tab') {
        e.preventDefault()
        doSave(e.shiftKey ? 'shift-tab' : 'tab')
      } else if (e.key === 'Escape') {
        e.preventDefault()
        doneRef.current = true
        clearTimeout(blurTimeoutRef.current)
        onCancel()
      }
    },
    [doSave, onCancel]
  )

  const handleBlur = useCallback(() => {
    blurTimeoutRef.current = setTimeout(() => doSave('blur'), 200)
  }, [doSave])

  return (
    <input
      ref={inputRef}
      type='text'
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder='mm/dd/yyyy'
      className={cn(
        'w-full min-w-0 select-text border-none bg-transparent p-0 text-foreground text-sm outline-none'
      )}
    />
  )
}

/** Inline editor for `string`/`number`/`json` columns. */
function InlineTextEditor({
  value,
  column,
  initialCharacter,
  onSave,
  onCancel,
}: InlineEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(() =>
    initialCharacter !== undefined ? initialCharacter : formatValueForInput(value, column.type)
  )
  const doneRef = useRef(false)

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.focus()
    if (initialCharacter !== undefined) {
      const len = input.value.length
      input.setSelectionRange(len, len)
    } else {
      input.select()
    }
  }, [])

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault()
    const container = e.currentTarget.closest('[data-table-scroll]') as HTMLElement | null
    if (container) container.scrollBy(e.deltaX, e.deltaY)
  }

  const doSave = (reason: SaveReason) => {
    if (doneRef.current) return
    doneRef.current = true
    try {
      onSave(cleanCellValue(draft, column), reason)
    } catch {
      onCancel()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      doSave('enter')
    } else if (e.key === 'Tab') {
      e.preventDefault()
      doSave(e.shiftKey ? 'shift-tab' : 'tab')
    } else if (e.key === 'Escape') {
      e.preventDefault()
      doneRef.current = true
      onCancel()
    }
  }

  return (
    <input
      ref={inputRef}
      type='text'
      inputMode={column.type === 'number' ? 'decimal' : undefined}
      value={draft ?? ''}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      onBlur={() => doSave('blur')}
      className='w-full min-w-0 select-text border-none bg-transparent p-0 text-foreground text-sm outline-none'
    />
  )
}

/** Dispatches to the right editor variant based on the column type. */
export function InlineEditor(props: InlineEditorProps) {
  if (props.column.type === 'date') {
    return <InlineDateEditor {...props} />
  }
  return <InlineTextEditor {...props} />
}
