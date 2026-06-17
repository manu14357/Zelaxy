'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createLogger } from '@/lib/logs/console/logger'
import type { ColumnDefinition, RowData, TableDefinition, TableRow } from '@/lib/table'
import {
  useCreateTableRow,
  useDeleteTableRow,
  useDeleteTableRows,
  useUpdateTableRow,
} from '@/hooks/queries/tables'
import { cleanCellValue } from '../../utils'

const logger = createLogger('RowModal')

export interface RowModalProps {
  mode: 'add' | 'edit' | 'delete'
  isOpen: boolean
  onClose: () => void
  table: TableDefinition
  row?: TableRow
  rowIds?: string[]
  onSuccess: () => void
}

function createInitialRowData(columns: ColumnDefinition[]): Record<string, unknown> {
  const initial: Record<string, unknown> = {}
  columns.forEach((col) => {
    initial[col.name] = col.type === 'boolean' ? false : ''
  })
  return initial
}

function cleanRowData(columns: ColumnDefinition[], rowData: Record<string, unknown>): RowData {
  const cleanData: RowData = {}
  columns.forEach((col) => {
    const value = rowData[col.name]
    try {
      cleanData[col.name] = cleanCellValue(value, col) as import('@/lib/table').JsonValue
    } catch {
      throw new Error(`Invalid JSON for field: ${col.name}`)
    }
  })
  return cleanData
}

function getInitialRowData(
  mode: RowModalProps['mode'],
  columns: ColumnDefinition[],
  row?: TableRow
): Record<string, unknown> {
  if (mode === 'add' && columns.length > 0) return createInitialRowData(columns)
  if (mode === 'edit' && row) return row.data as Record<string, unknown>
  return {}
}

function formatValueForInput(value: unknown, type: ColumnDefinition['type']): string {
  if (value === null || value === undefined || value === '') return ''
  if (type === 'json' && typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return ''
    }
  }
  return String(value)
}

export function RowModal({ mode, isOpen, onClose, table, row, rowIds, onSuccess }: RowModalProps) {
  const schema = table?.schema
  const columns = (schema?.columns ?? []).filter((c) => !c.workflowGroupId)

  const [rowData, setRowData] = useState<Record<string, unknown>>(() =>
    getInitialRowData(mode, columns, row)
  )
  const [error, setError] = useState<string | null>(null)

  const createRowMutation = useCreateTableRow(table.id)
  const updateRowMutation = useUpdateTableRow(table.id)
  const deleteRowMutation = useDeleteTableRow(table.id)
  const deleteRowsMutation = useDeleteTableRows(table.id)

  const isSubmitting =
    createRowMutation.isPending ||
    updateRowMutation.isPending ||
    deleteRowMutation.isPending ||
    deleteRowsMutation.isPending

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const cleanData = cleanRowData(columns, rowData)
      if (mode === 'add') {
        await createRowMutation.mutateAsync({ data: cleanData, workspaceId: table.workspaceId })
      } else if (mode === 'edit' && row) {
        await updateRowMutation.mutateAsync({ rowId: row.id, data: cleanData })
      }
      onSuccess()
    } catch (err) {
      logger.error(`Failed to ${mode} row:`, err)
      setError(err instanceof Error ? err.message : `Failed to ${mode} row`)
    }
  }

  const handleDelete = async () => {
    setError(null)
    const idsToDelete = rowIds ?? (row ? [row.id] : [])
    try {
      if (idsToDelete.length === 1) {
        await deleteRowMutation.mutateAsync(idsToDelete[0])
      } else {
        await deleteRowsMutation.mutateAsync(idsToDelete)
      }
      onSuccess()
    } catch (err) {
      logger.error('Failed to delete row(s):', err)
      setError(err instanceof Error ? err.message : 'Failed to delete row(s)')
    }
  }

  const handleClose = () => {
    setRowData({})
    setError(null)
    onClose()
  }

  if (mode === 'delete') {
    const deleteCount = rowIds?.length ?? (row ? 1 : 0)
    const isSingleRow = deleteCount === 1

    return (
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleClose()
        }}
      >
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Delete {isSingleRow ? 'Row' : `${deleteCount} Rows`}</DialogTitle>
          </DialogHeader>
          {error && (
            <div className='rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-destructive text-sm'>
              {error}
            </div>
          )}
          <DialogDescription>
            Are you sure you want to delete {isSingleRow ? 'this row' : `these ${deleteCount} rows`}
            ?{' '}
            <span className='text-destructive'>
              This will permanently remove all data in {isSingleRow ? 'this row' : 'these rows'}.
            </span>{' '}
            This action cannot be undone.
          </DialogDescription>
          <DialogFooter>
            <Button variant='outline' onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  const isAddMode = mode === 'add'

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{isAddMode ? 'Add New Row' : 'Edit Row'}</DialogTitle>
          <DialogDescription>
            {isAddMode ? 'Fill in the values for' : 'Update values for'} {table?.name ?? 'table'}
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[60vh] overflow-y-auto'>
          <form onSubmit={handleFormSubmit} className='flex flex-col gap-4 py-2'>
            {error && (
              <div className='rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-destructive text-sm'>
                {error}
              </div>
            )}
            {columns.map((column) => (
              <ColumnField
                key={column.name}
                column={column}
                value={rowData[column.name]}
                onChange={(value) => setRowData((prev) => ({ ...prev, [column.name]: value }))}
              />
            ))}
          </form>
        </div>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={handleClose}
            className='min-w-[90px]'
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type='button'
            onClick={handleFormSubmit}
            disabled={isSubmitting}
            className='min-w-[120px]'
          >
            {isSubmitting
              ? isAddMode
                ? 'Adding...'
                : 'Updating...'
              : isAddMode
                ? 'Add Row'
                : 'Update Row'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ColumnFieldProps {
  column: ColumnDefinition
  value: unknown
  onChange: (value: unknown) => void
}

function ColumnField({ column, value, onChange }: ColumnFieldProps) {
  return (
    <div className='flex flex-col gap-2'>
      <Label htmlFor={column.name} className='font-medium text-sm'>
        {column.name}
        {column.required && <span className='text-destructive'> *</span>}
        {column.unique && (
          <span className='ml-1.5 font-normal text-muted-foreground text-xs'>(unique)</span>
        )}
      </Label>

      {column.type === 'boolean' ? (
        <div className='flex items-center gap-2'>
          <Checkbox
            id={column.name}
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(checked === true)}
          />
          <Label htmlFor={column.name} className='font-normal text-muted-foreground text-sm'>
            {value ? 'True' : 'False'}
          </Label>
        </div>
      ) : column.type === 'json' ? (
        <Textarea
          id={column.name}
          value={formatValueForInput(value, column.type)}
          onChange={(e) => onChange(e.target.value)}
          placeholder='{"key": "value"}'
          rows={4}
          className='font-mono text-xs'
          required={column.required}
        />
      ) : (
        <Input
          id={column.name}
          type={column.type === 'number' ? 'number' : 'text'}
          value={formatValueForInput(value, column.type)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={column.type === 'date' ? 'YYYY-MM-DD' : `Enter ${column.name}`}
          className='h-[38px]'
          required={column.required}
        />
      )}

      <div className='text-muted-foreground text-xs'>
        Type: {column.type}
        {!column.required && ' (optional)'}
      </div>
    </div>
  )
}
