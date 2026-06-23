'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Collapsible structured-JSON viewer for the ZelaxyArena console — the reference mothership's
 * "structured view": each node is a row with a chevron (containers) and a type-colored value badge
 * (string = green, number = blue, boolean = orange, array = purple, object/null = gray).
 */

type JsonType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null'

function typeOf(value: unknown): JsonType {
  if (value === null || value === undefined) return 'null'
  if (Array.isArray(value)) return 'array'
  const t = typeof value
  if (t === 'string' || t === 'number' || t === 'boolean') return t
  return 'object'
}

const VALUE_COLOR: Record<JsonType, string> = {
  string: 'text-emerald-600 dark:text-emerald-400',
  number: 'text-blue-600 dark:text-blue-400',
  boolean: 'text-orange-600 dark:text-orange-400',
  array: 'text-purple-600 dark:text-purple-400',
  object: 'text-muted-foreground',
  null: 'text-muted-foreground',
}

function renderPrimitive(value: unknown, type: JsonType): string {
  if (type === 'string') return `"${value}"`
  if (type === 'null') return value === undefined ? 'undefined' : 'null'
  return String(value)
}

function JsonNode({
  name,
  value,
  depth,
}: {
  name?: string | number
  value: unknown
  depth: number
}) {
  const type = typeOf(value)
  const isContainer = type === 'object' || type === 'array'
  // Auto-expand the first couple of levels so the result is readable without clicking.
  const [open, setOpen] = useState(depth < 2)

  const indent = { paddingLeft: `${depth * 12}px` }

  if (!isContainer) {
    return (
      <div className='flex items-start gap-1.5 py-[1px]' style={indent}>
        {name !== undefined && <span className='text-foreground/70'>{String(name)}:</span>}
        <span className={cn('break-all', VALUE_COLOR[type])}>{renderPrimitive(value, type)}</span>
      </div>
    )
  }

  const entries: Array<[string | number, unknown]> =
    type === 'array'
      ? (value as unknown[]).map((v, i) => [i, v])
      : Object.entries(value as Record<string, unknown>)
  const summary = type === 'array' ? `array[${entries.length}]` : `{${entries.length}}`

  return (
    <div>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        className='flex w-full items-center gap-1 py-[1px] text-left hover:bg-accent/40'
        style={indent}
      >
        <ChevronDown
          className={cn(
            'h-3 w-3 flex-shrink-0 text-muted-foreground transition-transform',
            !open && '-rotate-90'
          )}
        />
        {name !== undefined && <span className='text-foreground/70'>{String(name)}:</span>}
        <span className={cn('font-medium', VALUE_COLOR[type])}>{summary}</span>
      </button>
      {open &&
        entries.map(([k, v]) => <JsonNode key={String(k)} name={k} value={v} depth={depth + 1} />)}
    </div>
  )
}

export function JsonTree({ data }: { data: unknown }) {
  return (
    <div className='font-mono text-[11px] leading-relaxed'>
      <JsonNode value={data} depth={0} />
    </div>
  )
}
