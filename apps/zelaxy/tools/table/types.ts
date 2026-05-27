import type {
  ColumnDefinition,
  Filter,
  RowData,
  Sort,
  TableDefinition,
  TableRow,
  TableSchema,
} from '@/lib/table'
import type { ToolResponse } from '@/tools/types'

export type TableToolExecutionContext = {
  workflowId?: string
  workspaceId?: string
  chatId?: string
}

export interface TableCreateParams {
  name: string
  description?: string
  schema: TableSchema
  _context?: TableToolExecutionContext
}

export interface TableListParams {
  _context?: TableToolExecutionContext
}

export interface TableRowInsertParams {
  tableId: string
  data: RowData
  _context?: TableToolExecutionContext
}

export interface TableRowUpdateParams {
  tableId: string
  rowId: string
  data: RowData
  _context?: TableToolExecutionContext
}

export interface TableRowDeleteParams {
  tableId: string
  rowId: string
  _context?: TableToolExecutionContext
}

export interface TableRowQueryParams {
  tableId: string
  filter?: Filter
  sort?: Sort
  limit?: number
  offset?: number
  _context?: TableToolExecutionContext
}

export interface TableRowGetParams {
  tableId: string
  rowId: string
  _context?: TableToolExecutionContext
}

export interface TableCreateResponse extends ToolResponse {
  output: {
    table: TableDefinition
    message: string
  }
}

export interface TableListResponse extends ToolResponse {
  output: {
    tables: TableDefinition[]
    totalCount: number
  }
}

export interface TableRowResponse extends ToolResponse {
  output: {
    row: TableRow
    message: string
  }
}

export interface TableQueryResponse extends ToolResponse {
  output: {
    rows: TableRow[]
    rowCount: number
    totalCount: number
    limit: number
    offset: number
  }
}

export interface TableDeleteResponse extends ToolResponse {
  output: {
    deletedCount: number
    message: string
  }
}

export interface TableBatchInsertParams {
  tableId: string
  rows: RowData[]
  _context?: TableToolExecutionContext
}

export interface TableBatchInsertResponse extends ToolResponse {
  output: {
    rows: TableRow[]
    insertedCount: number
    message: string
  }
}

export interface TableUpdateByFilterParams {
  tableId: string
  filter: Filter
  data: RowData
  limit?: number
  _context?: TableToolExecutionContext
}

export interface TableDeleteByFilterParams {
  tableId: string
  filter: Filter
  limit?: number
  _context?: TableToolExecutionContext
}

export interface TableBulkOperationResponse extends ToolResponse {
  output: {
    updatedCount?: number
    deletedCount?: number
    updatedRowIds?: string[]
    deletedRowIds?: string[]
    message: string
  }
}

export interface TableGetSchemaParams {
  tableId: string
  _context?: TableToolExecutionContext
}

export interface TableGetSchemaResponse extends ToolResponse {
  output: {
    name: string
    columns: ColumnDefinition[]
    message: string
  }
}

export interface TableUpsertResponse extends ToolResponse {
  output: {
    row: TableRow
    operation: 'insert' | 'update'
    message: string
  }
}
