'use client'

import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { ChevronDown, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ConditionOperators, Filter } from '@/lib/table'

// ─── Local types & constants ──────────────────────────────────────────────────

interface FilterRule {
  id: string
  logicalOperator: 'and' | 'or'
  column: string
  operator: string
  value: string
}

type ComparisonOperatorValue = keyof ConditionOperators

const COMPARISON_OPERATORS: { value: ComparisonOperatorValue; label: string }[] = [
  { value: '$eq', label: 'equals' },
  { value: '$ne', label: 'not equals' },
  { value: '$gt', label: 'greater than' },
  { value: '$gte', label: 'greater than or equal' },
  { value: '$lt', label: 'less than' },
  { value: '$lte', label: 'less than or equal' },
  { value: '$contains', label: 'contains' },
]

const OPERATOR_LABELS = Object.fromEntries(
  COMPARISON_OPERATORS.map((op) => [op.value, op.label])
) as Record<string, string>

let _idCounter = 0
function nextId() {
  _idCounter = (_idCounter + 1) % 1_000_000
  return String(_idCounter)
}

// ─── Filter ↔ rule converters ─────────────────────────────────────────────────

function filterRulesToFilter(rules: FilterRule[]): Filter | null {
  if (rules.length === 0) return null

  const conditions = rules
    .filter((r) => r.column && r.value)
    .map((r) => ({
      [r.column]: { [r.operator]: r.operator === '$contains' ? r.value : r.value } as ConditionOperators,
    }))

  if (conditions.length === 0) return null
  if (conditions.length === 1) return conditions[0]

  // Group by logical operator: first rule is always included; subsequent
  // rules chain via their logicalOperator against the accumulating filter.
  // For simplicity we build a flat $and / $or at the top level.
  const andConditions = [conditions[0]]
  const orConditions: Filter[] = []

  for (let i = 1; i < conditions.length; i++) {
    const rule = rules[i]
    if (rule.logicalOperator === 'or') {
      orConditions.push(conditions[i])
    } else {
      andConditions.push(conditions[i])
    }
  }

  const andFilter: Filter = andConditions.length === 1 ? andConditions[0] : { $and: andConditions }

  if (orConditions.length === 0) return andFilter
  return { $or: [andFilter, ...orConditions] }
}

function filterToRules(filter: Filter | null): FilterRule[] {
  if (!filter) return []

  // Only parse simple flat $and / $or at the top level (the format we write above).
  const extractCondition = (f: Filter): FilterRule[] => {
    const rules: FilterRule[] = []
    for (const key of Object.keys(f)) {
      if (key === '$and' || key === '$or') continue
      const cond = f[key] as ConditionOperators | undefined
      if (!cond || typeof cond !== 'object') continue
      for (const op of Object.keys(cond) as ComparisonOperatorValue[]) {
        const val = cond[op]
        if (val !== undefined && val !== null) {
          rules.push({
            id: nextId(),
            logicalOperator: 'and',
            column: key,
            operator: op,
            value: String(val),
          })
        }
      }
    }
    return rules
  }

  if (filter.$and) {
    return filter.$and.flatMap((f) => extractCondition(f as Filter))
  }
  if (filter.$or) {
    const [first, ...rest] = filter.$or as Filter[]
    const firstRules = extractCondition(first)
    const orRules = rest.flatMap((f) => {
      const r = extractCondition(f as Filter)
      return r.map((rule, i) => (i === 0 ? { ...rule, logicalOperator: 'or' as const } : rule))
    })
    return [...firstRules, ...orRules]
  }

  return extractCondition(filter)
}

function createRule(columns: Array<{ name: string }>): FilterRule {
  return {
    id: nextId(),
    logicalOperator: 'and',
    column: columns[0]?.name ?? '',
    operator: '$eq',
    value: '',
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TableFilterProps {
  columns: Array<{ name: string; type: string }>
  filter: Filter | null
  onApply: (filter: Filter | null) => void
  onClose: () => void
}

export function TableFilter({ columns, filter, onApply, onClose }: TableFilterProps) {
  const [rules, setRules] = useState<FilterRule[]>(() => {
    const fromFilter = filterToRules(filter)
    return fromFilter.length > 0 ? fromFilter : [createRule(columns)]
  })

  const rulesRef = useRef(rules)
  rulesRef.current = rules

  const columnOptions = useMemo(
    () => columns.map((col) => ({ value: col.name, label: col.name })),
    [columns]
  )

  const handleAdd = useCallback(() => {
    setRules((prev) => [...prev, createRule(columns)])
  }, [columns])

  const handleRemove = useCallback(
    (id: string) => {
      const next = rulesRef.current.filter((r) => r.id !== id)
      if (next.length === 0) {
        onApply(null)
        onClose()
        setRules([createRule(columns)])
      } else {
        setRules(next)
      }
    },
    [columns, onApply, onClose]
  )

  const handleUpdate = useCallback(
    (id: string, field: keyof FilterRule, value: string) => {
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
    },
    []
  )

  const handleToggleLogical = useCallback((id: string) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, logicalOperator: r.logicalOperator === 'and' ? 'or' : 'and' } : r
      )
    )
  }, [])

  const handleApply = useCallback(() => {
    const validRules = rulesRef.current.filter((r) => r.column && r.value)
    onApply(filterRulesToFilter(validRules))
  }, [onApply])

  const handleClear = useCallback(() => {
    setRules([createRule(columns)])
    onApply(null)
  }, [columns, onApply])

  return (
    <div className='border-b border-border bg-background px-4 py-2'>
      <div className='flex flex-col gap-1'>
        {rules.map((rule, index) => (
          <FilterRuleRow
            key={rule.id}
            rule={rule}
            isFirst={index === 0}
            columns={columnOptions}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
            onApply={handleApply}
            onToggleLogical={handleToggleLogical}
          />
        ))}

        <div className='mt-1 flex items-center justify-between'>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleAdd}
            className='px-2 py-1 text-muted-foreground text-xs'
          >
            <Plus className='mr-1 size-[10px]' />
            Add filter
          </Button>
          <div className='flex items-center gap-1.5'>
            {filter !== null && (
              <Button
                variant='ghost'
                size='sm'
                onClick={handleClear}
                className='px-2 py-1 text-muted-foreground text-xs'
              >
                Clear filters
              </Button>
            )}
            <Button variant='outline' size='sm' onClick={handleApply} className='text-xs'>
              Apply filter
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FilterRuleRowProps {
  rule: FilterRule
  isFirst: boolean
  columns: Array<{ value: string; label: string }>
  onUpdate: (id: string, field: keyof FilterRule, value: string) => void
  onRemove: (id: string) => void
  onApply: () => void
  onToggleLogical: (id: string) => void
}

const FilterRuleRow = memo(function FilterRuleRow({
  rule,
  isFirst,
  columns,
  onUpdate,
  onRemove,
  onApply,
  onToggleLogical,
}: FilterRuleRowProps) {
  return (
    <div className='flex items-center gap-1.5'>
      {isFirst ? (
        <span className='w-[42px] shrink-0 text-right text-muted-foreground text-xs'>Where</span>
      ) : (
        <button
          onClick={() => onToggleLogical(rule.id)}
          className='w-[42px] shrink-0 rounded-full py-0.5 text-right font-medium text-[10px] text-muted-foreground uppercase tracking-wide transition-colors hover:text-foreground'
        >
          {rule.logicalOperator}
        </button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className='flex h-[28px] min-w-[100px] items-center justify-between rounded-[5px] border border-border bg-transparent px-2 text-muted-foreground text-xs outline-none hover:border-foreground/30'>
            <span className='truncate'>{rule.column || 'Column'}</span>
            <ChevronDown className='ml-1 size-[10px] shrink-0' />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start'>
          {columns.map((col) => (
            <DropdownMenuItem
              key={col.value}
              onSelect={() => onUpdate(rule.id, 'column', col.value)}
            >
              {col.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className='flex h-[28px] min-w-[90px] items-center justify-between rounded-[5px] border border-border bg-transparent px-2 text-muted-foreground text-xs outline-none hover:border-foreground/30'>
            <span className='truncate'>{OPERATOR_LABELS[rule.operator] ?? rule.operator}</span>
            <ChevronDown className='ml-1 size-[10px] shrink-0' />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start'>
          {COMPARISON_OPERATORS.map((op) => (
            <DropdownMenuItem
              key={op.value}
              onSelect={() => onUpdate(rule.id, 'operator', op.value)}
            >
              {op.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        type='text'
        value={rule.value}
        onChange={(e) => onUpdate(rule.id, 'value', e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onApply()
        }}
        placeholder='Enter a value'
        className='h-[28px] flex-1 rounded-[5px] border border-border bg-transparent px-2 text-muted-foreground text-xs outline-none placeholder:text-muted-foreground/50 focus:border-foreground/30'
      />

      <button
        onClick={() => onRemove(rule.id)}
        className='flex size-[28px] shrink-0 items-center justify-center rounded-[5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
      >
        <X className='size-[12px]' />
      </button>
    </div>
  )
})
