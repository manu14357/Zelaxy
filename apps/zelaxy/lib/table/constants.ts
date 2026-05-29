/**
 * Pure constants for the Table feature — safe to import in client components.
 * No DB or Node.js-only imports here.
 */

export const COLUMN_TYPES = ['string', 'number', 'boolean', 'date', 'json'] as const

export const NAME_PATTERN = /^[a-z_][a-z0-9_]*$/i

export const TABLE_LIMITS = {
  MAX_TABLES_PER_WORKSPACE: 100,
  MAX_ROWS_PER_TABLE: 10000,
  MAX_ROW_SIZE_BYTES: 100 * 1024,
  MAX_COLUMNS_PER_TABLE: 50,
  MAX_TABLE_NAME_LENGTH: 128,
  MAX_COLUMN_NAME_LENGTH: 50,
  MAX_STRING_VALUE_LENGTH: 10000,
  MAX_DESCRIPTION_LENGTH: 500,
  DEFAULT_QUERY_LIMIT: 100,
  MAX_QUERY_LIMIT: 1000,
  MAX_BATCH_INSERT_SIZE: 1000,
  MAX_BULK_OPERATION_SIZE: 1000,
} as const

/** Number of CSV rows sampled when inferring column types. */
export const CSV_SCHEMA_SAMPLE_SIZE = 100

/** Maximum rows inserted per batchInsertRows call during import. */
export const CSV_MAX_BATCH_SIZE = 1000

/** Maximum CSV/TSV file size accepted by import routes (25 MB). */
export const CSV_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024

export type ColumnType = (typeof COLUMN_TYPES)[number]
export type ColumnValue = string | number | boolean | null
export type JsonValue = ColumnValue | JsonValue[] | { [key: string]: JsonValue }
