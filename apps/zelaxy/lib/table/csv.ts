/**
 * Pure CSV utilities for the Table feature — safe to import in client components.
 * No DB, no Node.js-only imports here.
 */

import type { ColumnType, ColumnValue, JsonValue } from './constants'
import { CSV_SCHEMA_SAMPLE_SIZE } from './constants'

export type { ColumnType, ColumnValue, JsonValue }

// ─── Shared types needed by CSV helpers ──────────────────────────────────────

export interface ColumnDefinition {
  name: string
  type: ColumnType
  required?: boolean
  unique?: boolean
  workflowGroupId?: string
}

export interface TableSchema {
  columns: ColumnDefinition[]
}

export type RowData = Record<string, JsonValue>

// ─── CSV helpers ─────────────────────────────────────────────────────────────

export type CsvColumnType = 'string' | 'number' | 'boolean' | 'date' | 'json'

export async function parseCsvBuffer(
  input: string | Buffer | Uint8Array,
  delimiter = ','
): Promise<{ headers: string[]; rows: Record<string, unknown>[] }> {
  const { parse } = await import('csv-parse/sync')

  let text: string
  if (typeof input === 'string') {
    text = input
  } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) {
    text = input.toString('utf-8')
  } else {
    text = new TextDecoder('utf-8').decode(input as Uint8Array)
  }
  text = text.replace(/^\uFEFF/, '')

  const parsed = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    relax_quotes: true,
    skip_records_with_error: true,
    cast: false,
    delimiter,
  }) as Record<string, unknown>[]

  if (parsed.length === 0) {
    throw new Error('CSV file has no data rows')
  }

  const headers = Object.keys(parsed[0])
  if (headers.length === 0) {
    throw new Error('CSV file has no headers')
  }

  return { headers, rows: parsed }
}

export function inferColumnType(values: unknown[]): Exclude<CsvColumnType, 'json'> {
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && v !== '')
  if (nonEmpty.length === 0) return 'string'

  if (
    nonEmpty.every((v) => {
      const n = Number(v)
      return !Number.isNaN(n) && String(v).trim() !== ''
    })
  ) {
    return 'number'
  }

  if (
    nonEmpty.every((v) => {
      const s = String(v).toLowerCase()
      return s === 'true' || s === 'false'
    })
  ) {
    return 'boolean'
  }

  const isoDatePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?/
  if (
    nonEmpty.every((v) => {
      const s = String(v)
      return isoDatePattern.test(s) && !Number.isNaN(Date.parse(s))
    })
  ) {
    return 'date'
  }

  return 'string'
}

export function sanitizeName(raw: string, fallbackPrefix = 'col'): string {
  let name = raw
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

  if (!name || /^\d/.test(name)) {
    name = `${fallbackPrefix}_${name}`
  }

  return name
}

export function inferSchemaFromCsv(
  headers: string[],
  rows: Record<string, unknown>[]
): { columns: ColumnDefinition[]; headerToColumn: Map<string, string> } {
  const sample = rows.slice(0, CSV_SCHEMA_SAMPLE_SIZE)
  const seen = new Set<string>()
  const headerToColumn = new Map<string, string>()

  const columns = headers.map((header) => {
    const base = sanitizeName(header)
    let colName = base
    let suffix = 2
    while (seen.has(colName.toLowerCase())) {
      colName = `${base}_${suffix}`
      suffix++
    }
    seen.add(colName.toLowerCase())
    headerToColumn.set(header, colName)

    return {
      name: colName,
      type: inferColumnType(sample.map((r) => r[header])),
    } satisfies ColumnDefinition
  })

  return { columns, headerToColumn }
}

export function coerceValue(
  value: unknown,
  colType: CsvColumnType
): string | number | boolean | null | Record<string, unknown> | unknown[] {
  if (value === null || value === undefined || value === '') return null
  switch (colType) {
    case 'number': {
      const n = Number(value)
      return Number.isNaN(n) ? null : n
    }
    case 'boolean': {
      const s = String(value).toLowerCase()
      if (s === 'true') return true
      if (s === 'false') return false
      return null
    }
    case 'date': {
      const d = new Date(String(value))
      return Number.isNaN(d.getTime()) ? String(value) : d.toISOString()
    }
    case 'json': {
      if (typeof value === 'object') return value as Record<string, unknown> | unknown[]
      try {
        return JSON.parse(String(value))
      } catch {
        return String(value)
      }
    }
    default:
      return String(value)
  }
}

export function coerceRowsForTable(
  rows: Record<string, unknown>[],
  tableSchema: TableSchema,
  headerToColumn: Map<string, string>
): RowData[] {
  const typeByName = new Map(tableSchema.columns.map((c) => [c.name, c.type as CsvColumnType]))

  return rows.map((row) => {
    const coerced: RowData = {}
    for (const [header, value] of Object.entries(row)) {
      const colName = headerToColumn.get(header)
      if (!colName) continue
      const colType = typeByName.get(colName) ?? 'string'
      coerced[colName] = coerceValue(value, colType) as RowData[string]
    }
    return coerced
  })
}

// ─── CSV Mapping ─────────────────────────────────────────────────────────────

export type CsvHeaderMapping = Record<string, string | null>

export interface CsvMappingValidationResult {
  mappedHeaders: string[]
  skippedHeaders: string[]
  unmappedColumns: string[]
  effectiveMap: Map<string, string>
}

export class CsvImportValidationError extends Error {
  readonly code = 'CSV_IMPORT_VALIDATION' as const
  readonly details: {
    missingRequired?: string[]
    duplicateTargets?: string[]
    unknownColumns?: string[]
    unknownHeaders?: string[]
  }
  constructor(
    message: string,
    details: {
      missingRequired?: string[]
      duplicateTargets?: string[]
      unknownColumns?: string[]
      unknownHeaders?: string[]
    } = {}
  ) {
    super(message)
    this.name = 'CsvImportValidationError'
    this.details = details
  }
}

export function validateMapping(params: {
  csvHeaders: string[]
  mapping: CsvHeaderMapping
  tableSchema: TableSchema
}): CsvMappingValidationResult {
  const { csvHeaders, mapping, tableSchema } = params
  const columnByName = new Map(tableSchema.columns.map((c) => [c.name, c]))

  const unknownHeaders = Object.keys(mapping).filter((h) => !csvHeaders.includes(h))
  if (unknownHeaders.length > 0) {
    throw new CsvImportValidationError(
      `Mapping references unknown CSV headers: ${unknownHeaders.join(', ')}`,
      { unknownHeaders }
    )
  }

  const targetsSeen = new Map<string, string[]>()
  const unknownColumns: string[] = []
  const effectiveMap = new Map<string, string>()
  const skippedHeaders: string[] = []

  for (const header of csvHeaders) {
    const target = header in mapping ? mapping[header] : undefined
    if (target === null || target === undefined) {
      skippedHeaders.push(header)
      continue
    }
    if (!columnByName.has(target)) {
      unknownColumns.push(target)
      continue
    }
    const existing = targetsSeen.get(target) ?? []
    existing.push(header)
    targetsSeen.set(target, existing)
    effectiveMap.set(header, target)
  }

  if (unknownColumns.length > 0) {
    throw new CsvImportValidationError(
      `Mapping references columns that do not exist on the table: ${unknownColumns.join(', ')}`,
      { unknownColumns }
    )
  }

  const duplicateTargets = [...targetsSeen.entries()]
    .filter(([, headers]) => headers.length > 1)
    .map(([col]) => col)
  if (duplicateTargets.length > 0) {
    throw new CsvImportValidationError(
      `Multiple CSV headers map to the same column(s): ${duplicateTargets.join(', ')}`,
      { duplicateTargets }
    )
  }

  const mappedTargets = new Set(effectiveMap.values())
  const unmappedColumns = tableSchema.columns
    .filter((c) => !mappedTargets.has(c.name))
    .map((c) => c.name)

  const missingRequired = tableSchema.columns
    .filter((c) => c.required && !mappedTargets.has(c.name))
    .map((c) => c.name)
  if (missingRequired.length > 0) {
    throw new CsvImportValidationError(
      `CSV is missing required columns: ${missingRequired.join(', ')}`,
      { missingRequired }
    )
  }

  return { mappedHeaders: [...effectiveMap.keys()], skippedHeaders, unmappedColumns, effectiveMap }
}

export function buildAutoMapping(csvHeaders: string[], tableSchema: TableSchema): CsvHeaderMapping {
  const mapping: CsvHeaderMapping = {}
  const columns = tableSchema.columns
  const exactByName = new Map(columns.map((c) => [c.name, c.name]))
  const loose = new Map<string, string>()
  for (const col of columns) {
    loose.set(col.name.toLowerCase().replace(/[^a-z0-9]/g, ''), col.name)
  }
  const usedTargets = new Set<string>()
  for (const header of csvHeaders) {
    const san = sanitizeName(header)
    const exact = exactByName.get(san)
    if (exact && !usedTargets.has(exact)) {
      mapping[header] = exact
      usedTargets.add(exact)
      continue
    }
    const key = header.toLowerCase().replace(/[^a-z0-9]/g, '')
    const fuzzy = loose.get(key)
    if (fuzzy && !usedTargets.has(fuzzy)) {
      mapping[header] = fuzzy
      usedTargets.add(fuzzy)
      continue
    }
    mapping[header] = null
  }
  return mapping
}
