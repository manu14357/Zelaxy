'use client'

import { useMemo, useRef, useState } from 'react'
import { FileText, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { buildAutoMapping, parseCsvBuffer } from '@/lib/table'
import type { TableDefinition } from '@/lib/table'
import { createLogger } from '@/lib/logs/console/logger'
import { useImportCsvIntoTable } from '@/hooks/queries/tables'

type CsvImportMode = 'append' | 'replace'

const logger = createLogger('ImportCsvDialog')

const MAX_SAMPLE_ROWS = 5
const SKIP_VALUE = '__ skip __'
const CREATE_VALUE = '__ create __'

function summarizeImportError(message: string): string {
  const uniqueMatches = [
    ...message.matchAll(/Column\s+"([^"]+)"\s+must be unique\.\s+Value\s+"([^"]+)"/g),
  ]
  if (uniqueMatches.length > 0) {
    const column = uniqueMatches[0][1]
    const values = Array.from(new Set(uniqueMatches.map((m) => m[2])))
    const preview = values.slice(0, 3).map((v) => `"${v}"`).join(', ')
    const extra = values.length - 3
    return `${values.length} row${values.length === 1 ? '' : 's'} conflict on unique column "${column}" (${preview}${extra > 0 ? `, +${extra} more` : ''})`
  }
  const trimmed = message.trim()
  return trimmed.length > 180 ? `${trimmed.slice(0, 177)}...` : trimmed
}

interface ImportCsvDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  table: TableDefinition
  onImported?: (result: { insertedCount?: number; deletedCount?: number }) => void
}

interface ParsedCsv {
  file: File
  headers: string[]
  sampleRows: Record<string, unknown>[]
  totalRows: number
}

export function ImportCsvDialog({
  open,
  onOpenChange,
  workspaceId,
  table,
  onImported,
}: ImportCsvDialogProps) {
  const [parsed, setParsed] = useState<ParsedCsv | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const [mapping, setMapping] = useState<Record<string, string | null>>({})
  const [createHeaders, setCreateHeaders] = useState<Set<string>>(new Set())
  const [mode, setMode] = useState<CsvImportMode>('append')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importMutation = useImportCsvIntoTable(table.id)

  function resetState() {
    setParsed(null)
    setParseError(null)
    setSubmitError(null)
    setMapping({})
    setCreateHeaders(new Set())
    setMode('append')
    setIsDragging(false)
    setParsing(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) resetState()
    onOpenChange(newOpen)
  }

  async function handleFileSelected(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'csv' && ext !== 'tsv') {
      setParseError('Only CSV and TSV files are supported')
      return
    }
    setParsing(true)
    setParseError(null)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const delimiter = ext === 'tsv' ? '\t' : ','
      const { headers, rows } = await parseCsvBuffer(new Uint8Array(arrayBuffer), delimiter)
      const autoMapping = buildAutoMapping(headers, table.schema)
      setParsed({ file, headers, sampleRows: rows.slice(0, MAX_SAMPLE_ROWS), totalRows: rows.length })
      setMapping(autoMapping)
    } catch (err) {
      logger.error('CSV parse failed', err)
      setParseError(err instanceof Error ? err.message : 'Failed to parse CSV')
    } finally {
      setParsing(false)
    }
  }

  function handleMappingChange(header: string, value: string) {
    setSubmitError(null)
    if (value === CREATE_VALUE) {
      setCreateHeaders((prev) => { const next = new Set(prev); next.add(header); return next })
      setMapping((prev) => ({ ...prev, [header]: null }))
      return
    }
    setCreateHeaders((prev) => {
      if (!prev.has(header)) return prev
      const next = new Set(prev); next.delete(header); return next
    })
    setMapping((prev) => ({ ...prev, [header]: value === SKIP_VALUE ? null : value }))
  }

  const { missingRequired, duplicateTargets, mappedCount, skipCount, createCount } = useMemo(() => {
    const mappedTargets = new Map<string, string[]>()
    let mapped = 0; let skipped = 0; let creating = 0
    for (const header of parsed?.headers ?? []) {
      if (createHeaders.has(header)) { creating++; continue }
      const target = mapping[header]
      if (!target) { skipped++; continue }
      mapped++
      const existing = mappedTargets.get(target) ?? []
      existing.push(header)
      mappedTargets.set(target, existing)
    }
    const dupes = [...mappedTargets.entries()].filter(([, hs]) => hs.length > 1).map(([col]) => col)
    const mappedSet = new Set(mappedTargets.keys())
    const missing = table.schema.columns.filter((c) => c.required && !mappedSet.has(c.name)).map((c) => c.name)
    return { missingRequired: missing, duplicateTargets: dupes, mappedCount: mapped, skipCount: skipped, createCount: creating }
  }, [mapping, parsed?.headers, table.schema.columns, createHeaders])

  const canSubmit =
    parsed !== null &&
    !importMutation.isPending &&
    missingRequired.length === 0 &&
    duplicateTargets.length === 0 &&
    mappedCount + createCount > 0

  async function handleSubmit() {
    if (!parsed || !canSubmit) return
    setSubmitError(null)
    try {
      const result = await importMutation.mutateAsync({
        file: parsed.file,
        mode,
        mapping,
      })
      if (mode === 'append') {
        toast.success(`Imported ${result?.insertedCount ?? 0} rows into "${table.name}"`)
      } else {
        toast.success(`Replaced rows in "${table.name}": deleted ${result?.deletedCount ?? 0}, inserted ${result?.insertedCount ?? 0}`)
      }
      onImported?.({ insertedCount: result?.insertedCount, deletedCount: result?.deletedCount })
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import CSV'
      setSubmitError(summarizeImportError(message))
      logger.error('CSV import failed', err)
    }
  }

  const columnOptions = useMemo(() => [
    { label: 'Do not import', value: SKIP_VALUE },
    { label: '+ Create new column', value: CREATE_VALUE },
    ...table.schema.columns.map((col) => ({
      label: col.required ? `${col.name} (required)` : col.name,
      value: col.name,
    })),
  ], [table.schema.columns])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Import CSV into {table.name}</DialogTitle>
          <DialogDescription>
            Upload and map a CSV file to import rows into this table.
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4 py-2'>
          {!parsed ? (
            <div className='flex flex-col gap-2'>
              <Label>Select file</Label>
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) void handleFileSelected(f) }}
                disabled={parsing}
                className={cn(
                  'flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-8 transition-colors hover:bg-muted/30',
                  isDragging && 'border-primary bg-primary/5',
                  parsing && 'cursor-not-allowed opacity-50'
                )}
              >
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='.csv,.tsv'
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFileSelected(f) }}
                  className='hidden'
                />
                <Upload className='h-8 w-8 text-muted-foreground' />
                <div className='text-center'>
                  <p className='font-medium text-sm text-foreground'>
                    {parsing ? 'Parsing...' : isDragging ? 'Drop file here' : 'Drop CSV or TSV here or click to browse'}
                  </p>
                  <p className='mt-1 text-muted-foreground text-xs'>
                    Map columns to append or replace rows in this table
                  </p>
                </div>
              </button>
              {parseError && (
                <p className='text-destructive text-sm'>{parseError}</p>
              )}
            </div>
          ) : (
            <>
              {/* File info */}
              <div className='flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-3'>
                <div className='flex items-center gap-2 min-w-0'>
                  <FileText className='h-4 w-4 shrink-0 text-muted-foreground' />
                  <div className='min-w-0'>
                    <p className='truncate font-medium text-sm text-foreground'>{parsed.file.name}</p>
                    <p className='text-muted-foreground text-xs'>{parsed.totalRows.toLocaleString()} rows · {parsed.headers.length} columns</p>
                  </div>
                </div>
                <Button variant='ghost' size='sm' onClick={resetState}>
                  <X className='mr-1 h-3.5 w-3.5' />
                  Change
                </Button>
              </div>

              {/* Mode */}
              <div className='flex flex-col gap-2'>
                <Label>Import mode</Label>
                <div className='flex gap-2'>
                  {(['append', 'replace'] as const).map((m) => (
                    <button
                      key={m}
                      type='button'
                      onClick={() => setMode(m)}
                      className={cn(
                        'flex-1 rounded-lg border px-3 py-2 text-sm transition-colors',
                        mode === m
                          ? 'border-primary bg-primary/10 font-medium text-primary'
                          : 'border-border text-muted-foreground hover:bg-muted/30'
                      )}
                    >
                      {m === 'append' ? 'Append rows' : 'Replace all rows'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column mapping */}
              <div className='flex flex-col gap-2'>
                <div className='flex items-center justify-between'>
                  <Label>Column mapping</Label>
                  {skipCount > 0 && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        if (!parsed) return
                        setCreateHeaders((prev) => {
                          const next = new Set(prev)
                          for (const h of parsed.headers) {
                            if (!mapping[h] && !next.has(h)) next.add(h)
                          }
                          return next
                        })
                      }}
                    >
                      Create columns for {skipCount} unmapped
                    </Button>
                  )}
                </div>
                <div className='max-h-64 overflow-auto rounded-lg border border-border/40'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CSV column</TableHead>
                        <TableHead>Target column</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsed.headers.map((header) => {
                        const sample = parsed.sampleRows
                          .map((r) => (r[header] === '' || r[header] == null ? '' : String(r[header])))
                          .filter(Boolean)
                          .slice(0, 2)
                          .join(', ')
                        const currentValue = createHeaders.has(header) ? CREATE_VALUE : (mapping[header] ?? SKIP_VALUE)
                        return (
                          <TableRow key={header}>
                            <TableCell>
                              <div className='flex flex-col'>
                                <span className='truncate font-medium text-sm text-foreground'>{header}</span>
                                {sample && <span className='truncate text-muted-foreground text-xs'>{sample}</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={currentValue}
                                onValueChange={(v) => handleMappingChange(header, v)}
                              >
                                <SelectTrigger className='h-8 w-full text-xs'>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {columnOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className='text-xs'>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Validation warnings */}
              {missingRequired.length > 0 && (
                <p className='text-destructive text-sm'>
                  Missing required column(s): {missingRequired.join(', ')}
                </p>
              )}
              {duplicateTargets.length > 0 && (
                <p className='text-destructive text-sm'>
                  Duplicate mapping to: {duplicateTargets.join(', ')}
                </p>
              )}
              {submitError && (
                <p className='text-destructive text-sm'>{submitError}</p>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => handleOpenChange(false)} disabled={importMutation.isPending}>
            Cancel
          </Button>
          {parsed && (
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {importMutation.isPending ? 'Importing...' : `Import ${parsed.totalRows.toLocaleString()} rows`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
