/**
 * Table utilities module for Zelaxy.
 *
 * Provides types, constants, service functions, and CSV import helpers for
 * user-defined tables built on top of the userTableDefinitions / userTableRows schema.
 */

import crypto from 'crypto'
import { and, asc, count, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { userTableDefinitions, userTableRows } from '@/db/schema'
import type { ColumnType, ColumnValue, JsonValue } from './constants'
import {
  COLUMN_TYPES,
  CSV_MAX_BATCH_SIZE,
  CSV_MAX_FILE_SIZE_BYTES,
  CSV_SCHEMA_SAMPLE_SIZE,
  NAME_PATTERN,
  TABLE_LIMITS,
} from './constants'

// Re-export pure constants and types — safe for server-side use.
export {
  COLUMN_TYPES,
  NAME_PATTERN,
  TABLE_LIMITS,
  CSV_SCHEMA_SAMPLE_SIZE,
  CSV_MAX_BATCH_SIZE,
  CSV_MAX_FILE_SIZE_BYTES,
}
export type { ColumnType, ColumnValue, JsonValue }

// Re-export browser-safe CSV utilities and shared types from csv.ts
export type {
  ColumnDefinition,
  CsvColumnType,
  CsvHeaderMapping,
  CsvMappingValidationResult,
  RowData,
  TableSchema,
} from './csv'
export {
  buildAutoMapping,
  CsvImportValidationError,
  coerceRowsForTable,
  coerceValue,
  inferColumnType,
  inferSchemaFromCsv,
  parseCsvBuffer,
  sanitizeName,
  validateMapping,
} from './csv'

// Import the shared types for use in this server-only file
import type { ColumnDefinition, RowData, TableSchema } from './csv'

const logger = createLogger('TableService')

export type SortDirection = 'asc' | 'desc'

/** Sort specification mapping column names to direction. */
export type Sort = Record<string, SortDirection>

export interface ConditionOperators {
  $eq?: ColumnValue
  $ne?: ColumnValue
  $gt?: ColumnValue
  $gte?: ColumnValue
  $lt?: ColumnValue
  $lte?: ColumnValue
  $in?: ColumnValue[]
  $nin?: ColumnValue[]
  $contains?: string
}

/** Filter object for querying table rows. */
export interface Filter {
  $or?: Filter[]
  $and?: Filter[]
  [key: string]: ColumnValue | ConditionOperators | Filter[] | undefined
}

export interface TableMetadata {
  columnWidths?: Record<string, number>
  columnOrder?: string[]
}

export interface TableDefinition {
  id: string
  name: string
  description: string | null
  schema: TableSchema
  metadata: TableMetadata | null
  rowCount: number
  maxRows: number
  workspaceId: string
  createdBy: string | null
  archivedAt: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface TableRow {
  id: string
  data: RowData
  position: number
  createdAt: Date
  updatedAt: Date
}

export interface TablePlanLimits {
  maxTables: number
  maxRowsPerTable: number
}

export type TableScope = 'active' | 'archived' | 'all'

export interface CreateTableData {
  name: string
  description?: string | null
  schema: TableSchema
  workspaceId: string
  userId: string
  maxRows?: number
  maxTables?: number
  initialRowCount?: number
}

export interface BatchInsertData {
  tableId: string
  rows: RowData[]
  workspaceId: string
  userId?: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export class TableConflictError extends Error {
  readonly code = 'TABLE_EXISTS' as const
  constructor(name: string) {
    super(`A table named "${name}" already exists in this workspace`)
  }
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function validateTableName(name: string): ValidationResult {
  const errors: string[] = []

  if (!name || typeof name !== 'string') {
    errors.push('Table name is required')
    return { valid: false, errors }
  }

  if (name.length > TABLE_LIMITS.MAX_TABLE_NAME_LENGTH) {
    errors.push(
      `Table name exceeds maximum length (${TABLE_LIMITS.MAX_TABLE_NAME_LENGTH} characters)`
    )
  }

  if (!NAME_PATTERN.test(name)) {
    errors.push(
      'Table name must start with letter or underscore, followed by alphanumeric or underscore'
    )
  }

  return { valid: errors.length === 0, errors }
}

export function validateTableSchema(schema: TableSchema): ValidationResult {
  const errors: string[] = []

  if (!schema || typeof schema !== 'object') {
    errors.push('Schema is required')
    return { valid: false, errors }
  }

  if (!Array.isArray(schema.columns)) {
    errors.push('Schema must have columns array')
    return { valid: false, errors }
  }

  if (schema.columns.length === 0) {
    errors.push('Schema must have at least one column')
  }

  if (schema.columns.length > TABLE_LIMITS.MAX_COLUMNS_PER_TABLE) {
    errors.push(`Schema exceeds maximum columns (${TABLE_LIMITS.MAX_COLUMNS_PER_TABLE})`)
  }

  for (const column of schema.columns) {
    if (!column.name || !NAME_PATTERN.test(column.name)) {
      errors.push(
        `Invalid column name "${column.name}". Must start with letter/underscore, alphanumeric/underscore only.`
      )
    }
    if (!COLUMN_TYPES.includes(column.type)) {
      errors.push(
        `Invalid column type "${column.type}". Must be one of: ${COLUMN_TYPES.join(', ')}`
      )
    }
  }

  const columnNames = schema.columns.map((c) => c.name.toLowerCase())
  if (new Set(columnNames).size !== columnNames.length) {
    errors.push('Duplicate column names found')
  }

  return { valid: errors.length === 0, errors }
}

// ─── Billing / Limits ────────────────────────────────────────────────────────

/**
 * Returns table limits for a workspace.
 * Zelaxy currently applies generous defaults without per-plan billing.
 */
export async function getWorkspaceTableLimits(_workspaceId: string): Promise<TablePlanLimits> {
  return {
    maxTables: TABLE_LIMITS.MAX_TABLES_PER_WORKSPACE,
    maxRowsPerTable: TABLE_LIMITS.MAX_ROWS_PER_TABLE,
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

function generateTableId(): string {
  return `tbl_${crypto.randomUUID().replace(/-/g, '')}`
}

function generateRowId(): string {
  return `row_${crypto.randomUUID().replace(/-/g, '')}`
}

export async function getTableById(
  tableId: string,
  options?: { includeArchived?: boolean }
): Promise<TableDefinition | null> {
  const { includeArchived = false } = options ?? {}

  const results = await db
    .select({
      id: userTableDefinitions.id,
      name: userTableDefinitions.name,
      description: userTableDefinitions.description,
      schema: userTableDefinitions.schema,
      metadata: userTableDefinitions.metadata,
      maxRows: userTableDefinitions.maxRows,
      workspaceId: userTableDefinitions.workspaceId,
      createdBy: userTableDefinitions.createdBy,
      archivedAt: userTableDefinitions.archivedAt,
      createdAt: userTableDefinitions.createdAt,
      updatedAt: userTableDefinitions.updatedAt,
      rowCount: userTableDefinitions.rowCount,
    })
    .from(userTableDefinitions)
    .where(
      includeArchived
        ? eq(userTableDefinitions.id, tableId)
        : and(eq(userTableDefinitions.id, tableId), isNull(userTableDefinitions.archivedAt))
    )
    .limit(1)

  if (results.length === 0) return null

  const t = results[0]
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    schema: t.schema as TableSchema,
    metadata: (t.metadata as Record<string, unknown>) ?? null,
    rowCount: t.rowCount,
    maxRows: t.maxRows,
    workspaceId: t.workspaceId,
    createdBy: t.createdBy,
    archivedAt: t.archivedAt,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }
}

export async function listTables(
  workspaceId: string,
  options?: { scope?: TableScope }
): Promise<TableDefinition[]> {
  const { scope = 'active' } = options ?? {}

  const tables = await db
    .select({
      id: userTableDefinitions.id,
      name: userTableDefinitions.name,
      description: userTableDefinitions.description,
      schema: userTableDefinitions.schema,
      metadata: userTableDefinitions.metadata,
      maxRows: userTableDefinitions.maxRows,
      workspaceId: userTableDefinitions.workspaceId,
      createdBy: userTableDefinitions.createdBy,
      archivedAt: userTableDefinitions.archivedAt,
      createdAt: userTableDefinitions.createdAt,
      updatedAt: userTableDefinitions.updatedAt,
      rowCount: userTableDefinitions.rowCount,
    })
    .from(userTableDefinitions)
    .where(
      scope === 'all'
        ? eq(userTableDefinitions.workspaceId, workspaceId)
        : scope === 'archived'
          ? and(
              eq(userTableDefinitions.workspaceId, workspaceId),
              sql`${userTableDefinitions.archivedAt} IS NOT NULL`
            )
          : and(
              eq(userTableDefinitions.workspaceId, workspaceId),
              isNull(userTableDefinitions.archivedAt)
            )
    )
    .orderBy(userTableDefinitions.createdAt)

  return tables.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    schema: t.schema as TableSchema,
    metadata: (t.metadata as Record<string, unknown>) ?? null,
    rowCount: t.rowCount,
    maxRows: t.maxRows,
    workspaceId: t.workspaceId,
    createdBy: t.createdBy,
    archivedAt: t.archivedAt,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }))
}

export async function createTable(
  data: CreateTableData,
  requestId: string
): Promise<TableDefinition> {
  const nameValidation = validateTableName(data.name)
  if (!nameValidation.valid) {
    throw new Error(`Invalid table name: ${nameValidation.errors.join(', ')}`)
  }

  const schemaValidation = validateTableSchema(data.schema)
  if (!schemaValidation.valid) {
    throw new Error(`Invalid schema: ${schemaValidation.errors.join(', ')}`)
  }

  const tableId = generateTableId()
  const now = new Date()

  const maxRows = data.maxRows ?? TABLE_LIMITS.MAX_ROWS_PER_TABLE
  const maxTables = data.maxTables ?? TABLE_LIMITS.MAX_TABLES_PER_WORKSPACE

  const newTable = {
    id: tableId,
    name: data.name,
    description: data.description ?? null,
    schema: data.schema,
    workspaceId: data.workspaceId,
    createdBy: data.userId,
    maxRows,
    rowCount: 0,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  try {
    await db.transaction(async (trx) => {
      const [{ existingCount }] = await trx
        .select({ existingCount: count() })
        .from(userTableDefinitions)
        .where(
          and(
            eq(userTableDefinitions.workspaceId, data.workspaceId),
            isNull(userTableDefinitions.archivedAt)
          )
        )

      if (Number(existingCount) >= maxTables) {
        throw new Error(`Workspace has reached maximum table limit (${maxTables})`)
      }

      const duplicateName = await trx
        .select({ id: userTableDefinitions.id })
        .from(userTableDefinitions)
        .where(
          and(
            eq(userTableDefinitions.workspaceId, data.workspaceId),
            eq(userTableDefinitions.name, data.name),
            isNull(userTableDefinitions.archivedAt)
          )
        )
        .limit(1)

      if (duplicateName.length > 0) {
        throw new TableConflictError(data.name)
      }

      await trx.insert(userTableDefinitions).values(newTable)

      const initialRowCount = data.initialRowCount ?? 0
      if (initialRowCount > 0) {
        const rowsToInsert = Array.from({ length: initialRowCount }, (_, i) => ({
          id: generateRowId(),
          tableId,
          data: {},
          position: i,
          workspaceId: data.workspaceId,
          createdAt: now,
          updatedAt: now,
        }))
        await trx.insert(userTableRows).values(rowsToInsert)
      }
    })
  } catch (error: unknown) {
    if (error instanceof TableConflictError) throw error
    // Postgres unique violation
    if (
      error instanceof Error &&
      'code' in (error as NodeJS.ErrnoException) &&
      (error as NodeJS.ErrnoException).code === '23505'
    ) {
      throw new TableConflictError(data.name)
    }
    throw error
  }

  logger.info(`[${requestId}] Created table ${tableId} in workspace ${data.workspaceId}`)

  return {
    id: newTable.id,
    name: newTable.name,
    description: newTable.description,
    schema: newTable.schema as TableSchema,
    metadata: null,
    rowCount: data.initialRowCount ?? 0,
    maxRows: newTable.maxRows,
    workspaceId: newTable.workspaceId,
    createdBy: newTable.createdBy,
    archivedAt: newTable.archivedAt,
    createdAt: newTable.createdAt,
    updatedAt: newTable.updatedAt,
  }
}

export async function renameTable(
  tableId: string,
  newName: string,
  requestId: string
): Promise<{ id: string; name: string }> {
  const nameValidation = validateTableName(newName)
  if (!nameValidation.valid) {
    throw new Error(nameValidation.errors.join(', '))
  }

  const now = new Date()
  try {
    const result = await db
      .update(userTableDefinitions)
      .set({ name: newName, updatedAt: now })
      .where(eq(userTableDefinitions.id, tableId))
      .returning({ id: userTableDefinitions.id })

    if (result.length === 0) {
      throw new Error(`Table ${tableId} not found`)
    }

    logger.info(`[${requestId}] Renamed table ${tableId} to "${newName}"`)
    return { id: tableId, name: newName }
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      'code' in (error as NodeJS.ErrnoException) &&
      (error as NodeJS.ErrnoException).code === '23505'
    ) {
      throw new TableConflictError(newName)
    }
    throw error
  }
}

export async function deleteTable(tableId: string, requestId: string): Promise<void> {
  await db
    .update(userTableDefinitions)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(userTableDefinitions.id, tableId))

  logger.info(`[${requestId}] Archived table ${tableId}`)
}

export async function batchInsertRows(
  data: BatchInsertData,
  _table: TableDefinition,
  requestId: string
): Promise<TableRow[]> {
  if (data.rows.length === 0) {
    logger.info(
      `[${requestId}] Batch insert called with 0 rows for table ${data.tableId}, skipping`
    )
    return []
  }

  const now = new Date()

  const inserted = await db.transaction(async (trx) => {
    // Get the current max position for auto-assignment
    const [{ maxPos }] = await trx
      .select({
        maxPos: sql<number>`coalesce(max(${userTableRows.position}), -1)`.mapWith(Number),
      })
      .from(userTableRows)
      .where(eq(userTableRows.tableId, data.tableId))

    const startPos = maxPos + 1

    const rowsToInsert = data.rows.map((rowData, i) => ({
      id: generateRowId(),
      tableId: data.tableId,
      workspaceId: data.workspaceId,
      data: rowData,
      position: startPos + i,
      createdAt: now,
      updatedAt: now,
      ...(data.userId ? { createdBy: data.userId } : {}),
    }))

    const result = await trx.insert(userTableRows).values(rowsToInsert).returning()

    // insertRow/deleteRow(s) both keep this denormalized counter in sync; this path never did, so
    // every AI-built workflow's `table` block (batch_insert_rows) left the table's row_count stuck
    // at 0 forever regardless of how many rows actually landed — the Tables list reads this cached
    // column directly rather than counting rows, so it silently showed "0 rows" for populated tables.
    await trx
      .update(userTableDefinitions)
      .set({ rowCount: sql`${userTableDefinitions.rowCount} + ${result.length}`, updatedAt: now })
      .where(eq(userTableDefinitions.id, data.tableId))

    return result
  })

  logger.info(`[${requestId}] Batch inserted ${data.rows.length} rows into table ${data.tableId}`)

  return inserted.map((r) => ({
    id: r.id,
    data: r.data as RowData,
    position: r.position,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }))
}

// ─── Single Row Operations ────────────────────────────────────────────────────

export async function insertRow(
  data: { tableId: string; workspaceId: string; userId?: string; data: RowData; position?: number },
  requestId: string
): Promise<TableRow> {
  const now = new Date()
  const id = crypto.randomUUID()

  const position = await db.transaction(async (trx) => {
    if (data.position !== undefined) return data.position
    const [{ maxPos }] = await trx
      .select({ maxPos: sql<number>`coalesce(max(${userTableRows.position}), -1)`.mapWith(Number) })
      .from(userTableRows)
      .where(eq(userTableRows.tableId, data.tableId))
    return maxPos + 1
  })

  const [row] = await db
    .insert(userTableRows)
    .values({
      id,
      tableId: data.tableId,
      workspaceId: data.workspaceId,
      data: data.data,
      position,
      createdAt: now,
      updatedAt: now,
      ...(data.userId ? { createdBy: data.userId } : {}),
    })
    .returning()

  // Increment row count
  await db
    .update(userTableDefinitions)
    .set({ rowCount: sql`${userTableDefinitions.rowCount} + 1`, updatedAt: now })
    .where(eq(userTableDefinitions.id, data.tableId))

  logger.info(`[${requestId}] Inserted row ${id} into table ${data.tableId}`)
  return {
    id: row.id,
    data: row.data as RowData,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export interface ListRowsOptions {
  tableId: string
  limit?: number
  offset?: number
  filter?: Filter | null
  sort?: Sort | null
}

export interface ListRowsResult {
  rows: TableRow[]
  totalCount: number
  hasMore: boolean
}

export async function listRows(options: ListRowsOptions): Promise<ListRowsResult> {
  const { tableId, limit = 100, offset = 0, sort } = options

  const whereClause = eq(userTableRows.tableId, tableId)

  const orderClauses = sort
    ? Object.entries(sort).map(([col, dir]) =>
        dir === 'desc' ? desc(sql.raw(`data->>'${col}'`)) : asc(sql.raw(`data->>'${col}'`))
      )
    : [asc(userTableRows.position)]

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(userTableRows)
      .where(whereClause)
      .orderBy(...orderClauses)
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(userTableRows).where(whereClause),
  ])

  const totalCount = Number(total)
  return {
    rows: rows.map((r) => ({
      id: r.id,
      data: r.data as RowData,
      position: r.position,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    totalCount,
    hasMore: offset + rows.length < totalCount,
  }
}

export async function getRowById(tableId: string, rowId: string): Promise<TableRow | null> {
  const [row] = await db
    .select()
    .from(userTableRows)
    .where(and(eq(userTableRows.id, rowId), eq(userTableRows.tableId, tableId)))
    .limit(1)

  if (!row) return null
  return {
    id: row.id,
    data: row.data as RowData,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function updateRow(
  tableId: string,
  rowId: string,
  data: RowData,
  requestId: string
): Promise<TableRow> {
  const now = new Date()
  const [row] = await db
    .update(userTableRows)
    .set({ data, updatedAt: now })
    .where(and(eq(userTableRows.id, rowId), eq(userTableRows.tableId, tableId)))
    .returning()

  if (!row) throw new Error(`Row ${rowId} not found in table ${tableId}`)
  logger.info(`[${requestId}] Updated row ${rowId} in table ${tableId}`)
  return {
    id: row.id,
    data: row.data as RowData,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function deleteRow(tableId: string, rowId: string, requestId: string): Promise<void> {
  const now = new Date()
  await db.transaction(async (trx) => {
    await trx
      .delete(userTableRows)
      .where(and(eq(userTableRows.id, rowId), eq(userTableRows.tableId, tableId)))
    await trx
      .update(userTableDefinitions)
      .set({ rowCount: sql`greatest(${userTableDefinitions.rowCount} - 1, 0)`, updatedAt: now })
      .where(eq(userTableDefinitions.id, tableId))
  })
  logger.info(`[${requestId}] Deleted row ${rowId} from table ${tableId}`)
}

export async function deleteRows(
  tableId: string,
  rowIds: string[],
  requestId: string
): Promise<number> {
  if (rowIds.length === 0) return 0
  const now = new Date()
  let deletedCount = 0
  await db.transaction(async (trx) => {
    const result = await trx
      .delete(userTableRows)
      .where(and(eq(userTableRows.tableId, tableId), inArray(userTableRows.id, rowIds)))
      .returning({ id: userTableRows.id })
    deletedCount = result.length
    if (deletedCount > 0) {
      await trx
        .update(userTableDefinitions)
        .set({
          rowCount: sql`greatest(${userTableDefinitions.rowCount} - ${deletedCount}, 0)`,
          updatedAt: now,
        })
        .where(eq(userTableDefinitions.id, tableId))
    }
  })
  logger.info(`[${requestId}] Deleted ${deletedCount} rows from table ${tableId}`)
  return deletedCount
}

export async function batchUpdateRows(
  tableId: string,
  updates: Array<{ rowId: string; data: RowData }>,
  requestId: string
): Promise<void> {
  if (updates.length === 0) return
  const now = new Date()
  await db.transaction(async (trx) => {
    for (const { rowId, data } of updates) {
      await trx
        .update(userTableRows)
        .set({ data, updatedAt: now })
        .where(and(eq(userTableRows.id, rowId), eq(userTableRows.tableId, tableId)))
    }
  })
  logger.info(`[${requestId}] Batch updated ${updates.length} rows in table ${tableId}`)
}

// ─── Column Management ────────────────────────────────────────────────────────

export async function addColumn(
  tableId: string,
  column: ColumnDefinition,
  requestId: string
): Promise<TableDefinition> {
  const now = new Date()
  const [updated] = await db
    .update(userTableDefinitions)
    .set({
      schema: sql`jsonb_set(${userTableDefinitions.schema}, '{columns}', (${userTableDefinitions.schema}->'columns') || ${JSON.stringify([column])}::jsonb)`,
      updatedAt: now,
    })
    .where(eq(userTableDefinitions.id, tableId))
    .returning()

  if (!updated) throw new Error(`Table ${tableId} not found`)
  logger.info(`[${requestId}] Added column "${column.name}" to table ${tableId}`)

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    schema: updated.schema as TableSchema,
    metadata: (updated.metadata as TableMetadata) ?? null,
    rowCount: updated.rowCount,
    maxRows: updated.maxRows,
    workspaceId: updated.workspaceId,
    createdBy: updated.createdBy,
    archivedAt: updated.archivedAt,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  }
}

export async function updateColumn(
  tableId: string,
  columnName: string,
  updates: Partial<Pick<ColumnDefinition, 'name' | 'type' | 'required' | 'unique'>>,
  requestId: string
): Promise<TableDefinition> {
  const now = new Date()

  const table = await getTableById(tableId)
  if (!table) throw new Error(`Table ${tableId} not found`)

  const schema = table.schema as TableSchema
  const colIdx = schema.columns.findIndex((c) => c.name === columnName)
  if (colIdx === -1) throw new Error(`Column "${columnName}" not found`)

  const updatedColumns = schema.columns.map((c) =>
    c.name === columnName ? { ...c, ...updates } : c
  )
  const updatedSchema: TableSchema = { ...schema, columns: updatedColumns }

  const [updated] = await db
    .update(userTableDefinitions)
    .set({ schema: updatedSchema, updatedAt: now })
    .where(eq(userTableDefinitions.id, tableId))
    .returning()

  if (!updated) throw new Error(`Table ${tableId} not found`)
  logger.info(`[${requestId}] Updated column "${columnName}" in table ${tableId}`)

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    schema: updated.schema as TableSchema,
    metadata: (updated.metadata as TableMetadata) ?? null,
    rowCount: updated.rowCount,
    maxRows: updated.maxRows,
    workspaceId: updated.workspaceId,
    createdBy: updated.createdBy,
    archivedAt: updated.archivedAt,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  }
}

export async function deleteColumn(
  tableId: string,
  columnName: string,
  requestId: string
): Promise<TableDefinition> {
  const now = new Date()

  const table = await getTableById(tableId)
  if (!table) throw new Error(`Table ${tableId} not found`)

  const schema = table.schema as TableSchema
  const updatedColumns = schema.columns.filter((c) => c.name !== columnName)
  const updatedSchema: TableSchema = { ...schema, columns: updatedColumns }

  // Remove column data from all rows
  await db.transaction(async (trx) => {
    await trx
      .update(userTableDefinitions)
      .set({ schema: updatedSchema, updatedAt: now })
      .where(eq(userTableDefinitions.id, tableId))

    // Remove column key from all row data
    await trx
      .update(userTableRows)
      .set({
        data: sql`${userTableRows.data} - ${columnName}`,
        updatedAt: now,
      })
      .where(eq(userTableRows.tableId, tableId))
  })

  const [updated] = await db
    .select()
    .from(userTableDefinitions)
    .where(eq(userTableDefinitions.id, tableId))
    .limit(1)

  if (!updated) throw new Error(`Table ${tableId} not found`)
  logger.info(`[${requestId}] Deleted column "${columnName}" from table ${tableId}`)

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    schema: updated.schema as TableSchema,
    metadata: (updated.metadata as TableMetadata) ?? null,
    rowCount: updated.rowCount,
    maxRows: updated.maxRows,
    workspaceId: updated.workspaceId,
    createdBy: updated.createdBy,
    archivedAt: updated.archivedAt,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  }
}

export async function updateTableMetadata(
  tableId: string,
  metadata: Partial<TableMetadata>,
  requestId: string
): Promise<void> {
  const now = new Date()
  const table = await getTableById(tableId)
  if (!table) throw new Error(`Table ${tableId} not found`)

  const current = (table.metadata ?? {}) as TableMetadata
  const merged: TableMetadata = { ...current, ...metadata }

  await db
    .update(userTableDefinitions)
    .set({ metadata: merged as Record<string, unknown>, updatedAt: now })
    .where(eq(userTableDefinitions.id, tableId))

  logger.info(`[${requestId}] Updated metadata for table ${tableId}`)
}
