'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { ColumnDefinition } from '@/lib/table'
import { cn } from '@/lib/utils'
import { useAddTableColumn, useUpdateColumn } from '@/hooks/queries/tables'
import { PLAIN_COLUMN_TYPE_OPTIONS } from './column-types'

export type ColumnConfig =
  | { mode: 'create'; proposedName: string; type: ColumnDefinition['type'] }
  | { mode: 'edit'; columnName: string }

export interface ColumnConfigSidebarProps {
  config: ColumnConfig | null
  onClose: () => void
  existingColumn: ColumnDefinition | null
  tableId: string
  onColumnRename?: (oldName: string, newName: string) => void
}

function configKey(config: ColumnConfig | null): string {
  if (!config) return 'none'
  if (config.mode === 'create') return `create-${config.proposedName}-${config.type}`
  return `edit-${config.columnName}`
}

export function ColumnConfigSidebar({
  config,
  onClose,
  existingColumn,
  tableId,
  onColumnRename,
}: ColumnConfigSidebarProps) {
  const isOpen = config !== null

  return (
    <aside
      className={cn(
        'absolute top-0 right-0 bottom-0 z-50 flex w-[400px] flex-col border-border border-l bg-background shadow-lg transition-transform duration-200',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {isOpen && config && (
        <ColumnConfigBody
          key={configKey(config)}
          config={config}
          onClose={onClose}
          existingColumn={existingColumn}
          tableId={tableId}
          onColumnRename={onColumnRename}
        />
      )}
    </aside>
  )
}

interface ColumnConfigBodyProps {
  config: ColumnConfig
  onClose: () => void
  existingColumn: ColumnDefinition | null
  tableId: string
  onColumnRename?: (oldName: string, newName: string) => void
}

function ColumnConfigBody({
  config,
  onClose,
  existingColumn,
  tableId,
  onColumnRename,
}: ColumnConfigBodyProps) {
  const isCreate = config.mode === 'create'

  const [name, setName] = useState(isCreate ? config.proposedName : (existingColumn?.name ?? ''))
  const [type, setType] = useState<ColumnDefinition['type']>(
    isCreate ? config.type : (existingColumn?.type ?? 'string')
  )
  const [unique, setUnique] = useState(existingColumn?.unique ?? false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const addColumnMutation = useAddTableColumn(tableId)
  const updateColumnMutation = useUpdateColumn(tableId)

  const nameRef = useRef(name)
  nameRef.current = name

  useEffect(() => {
    if (name.trim()) setNameError(null)
  }, [name])

  const handleSave = useCallback(async () => {
    const trimmed = nameRef.current.trim()
    if (!trimmed) {
      setNameError('Column name is required')
      return
    }
    setSaveError(null)
    setIsSaving(true)

    try {
      if (isCreate) {
        await addColumnMutation.mutateAsync({ name: trimmed, type, unique })
      } else if (config.mode === 'edit') {
        const updates: { name?: string; type?: string; unique?: boolean } = { unique }
        if (trimmed !== config.columnName) updates.name = trimmed
        if (type !== existingColumn?.type) updates.type = type
        await updateColumnMutation.mutateAsync({ columnName: config.columnName, updates })
        if (trimmed !== config.columnName) {
          onColumnRename?.(config.columnName, trimmed)
        }
      }
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save column')
    } finally {
      setIsSaving(false)
    }
  }, [
    isCreate,
    config,
    type,
    unique,
    existingColumn,
    addColumnMutation,
    updateColumnMutation,
    onColumnRename,
    onClose,
  ])

  const selectedTypeOption = useMemo(
    () => PLAIN_COLUMN_TYPE_OPTIONS.find((o) => o.type === type),
    [type]
  )

  return (
    <>
      {/* Header */}
      <div className='flex items-center justify-between border-border border-b px-4 py-3'>
        <h2 className='font-semibold text-sm'>{isCreate ? 'New Column' : 'Edit Column'}</h2>
        <Button variant='ghost' size='sm' className='h-7 w-7 p-0' onClick={onClose}>
          ✕
        </Button>
      </div>

      {/* Body */}
      <div className='flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4'>
        {/* Name */}
        <div className='flex flex-col gap-1.5'>
          <RequiredLabel htmlFor='col-name'>Name</RequiredLabel>
          <Input
            id='col-name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='column_name'
            className={cn('h-8 text-sm', nameError && 'border-destructive')}
          />
          {nameError && <FieldError message={nameError} />}
        </div>

        <FieldDivider />

        {/* Type */}
        {(isCreate || config.mode === 'edit') && (
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='col-type' className='pl-0.5 text-sm'>
              Type
            </Label>
            <Select value={type} onValueChange={(val) => setType(val as ColumnDefinition['type'])}>
              <SelectTrigger id='col-type' className='h-8 text-sm'>
                <SelectValue>
                  {selectedTypeOption && (
                    <span className='flex items-center gap-1.5'>
                      <selectedTypeOption.icon className='size-3.5' />
                      {selectedTypeOption.label}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PLAIN_COLUMN_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.type} value={opt.type}>
                    <span className='flex items-center gap-1.5'>
                      <opt.icon className='size-3.5' />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <FieldDivider />

        {/* Unique */}
        <div className='flex items-center justify-between'>
          <div className='flex flex-col gap-0.5'>
            <Label htmlFor='col-unique' className='pl-0.5 text-sm'>
              Unique
            </Label>
            <p className='pl-0.5 text-muted-foreground text-xs'>
              Reject duplicate values in this column
            </p>
          </div>
          <Switch id='col-unique' checked={unique} onCheckedChange={setUnique} />
        </div>

        {saveError && <FieldError message={saveError} />}
      </div>

      {/* Footer */}
      <div className='flex items-center justify-end gap-2 border-border border-t px-4 py-3'>
        <Button variant='outline' size='sm' onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button size='sm' onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </>
  )
}

function RequiredLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <Label
      htmlFor={htmlFor}
      className='flex items-baseline gap-1.5 whitespace-nowrap pl-0.5 text-sm'
    >
      {children}
      <span className='ml-0.5'>*</span>
    </Label>
  )
}

function FieldError({ message }: { message: string }) {
  return <p className='pl-0.5 text-destructive text-xs'>{message}</p>
}

function FieldDivider() {
  return <hr className='my-1 border-border' />
}
