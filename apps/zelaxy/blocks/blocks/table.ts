import { TableIcon } from '@/components/icons'
import { TABLE_LIMITS } from '@/lib/table/constants'
import type { BlockConfig } from '@/blocks/types'
import type { TableQueryResponse } from '@/tools/table/types'

/**
 * Parses a JSON string with helpful error messages.
 *
 * Handles common issues like unquoted block references in JSON values.
 */
function parseJSON(value: string | unknown, fieldName: string): unknown {
  if (typeof value !== 'string') return value

  try {
    return JSON.parse(value)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)

    const unquotedValueMatch = value.match(
      /:\s*([a-zA-Z][a-zA-Z0-9_\s]*[a-zA-Z0-9]|[a-zA-Z])\s*[,}]/
    )

    let hint =
      'Make sure all property names are in double quotes (e.g., {"name": "value"} not {name: "value"}).'

    if (unquotedValueMatch) {
      hint =
        'It looks like a string value is not quoted. When using block references in JSON, wrap them in double quotes: {"field": "<blockName.output>"} not {"field": <blockName.output>}.'
    }

    throw new Error(`Invalid JSON in ${fieldName}: ${errorMsg}. ${hint}`)
  }
}

/** Raw params from block UI before JSON parsing and type conversion */
interface TableBlockParams {
  operation: string
  tableId?: string
  rowId?: string
  data?: string | unknown
  rows?: string | unknown
  filter?: string | unknown
  sort?: string | unknown
  limit?: string
  offset?: string
}

/** Normalized params after parsing, ready for tool request body */
interface ParsedParams {
  tableId?: string
  rowId?: string
  data?: unknown
  rows?: unknown
  filter?: unknown
  sort?: unknown
  limit?: number
  offset?: number
}

/** Transforms raw block params into tool request params for each operation */
const paramTransformers: Record<string, (params: TableBlockParams) => ParsedParams> = {
  insert_row: (params) => ({
    tableId: params.tableId,
    data: parseJSON(params.data, 'Row Data'),
  }),

  upsert_row: (params) => ({
    tableId: params.tableId,
    data: parseJSON(params.data, 'Row Data'),
  }),

  batch_insert_rows: (params) => ({
    tableId: params.tableId,
    rows: parseJSON(params.rows, 'Rows Data'),
  }),

  update_row: (params) => ({
    tableId: params.tableId,
    rowId: params.rowId,
    data: parseJSON(params.data, 'Row Data'),
  }),

  update_rows_by_filter: (params) => ({
    tableId: params.tableId,
    filter: params.filter ? parseJSON(params.filter, 'Filter') : undefined,
    data: parseJSON(params.data, 'Row Data'),
    limit: params.limit ? Number.parseInt(params.limit) : undefined,
  }),

  delete_row: (params) => ({
    tableId: params.tableId,
    rowId: params.rowId,
  }),

  delete_rows_by_filter: (params) => ({
    tableId: params.tableId,
    filter: params.filter ? parseJSON(params.filter, 'Filter') : undefined,
    limit: params.limit ? Number.parseInt(params.limit) : undefined,
  }),

  get_row: (params) => ({
    tableId: params.tableId,
    rowId: params.rowId,
  }),

  get_schema: (params) => ({
    tableId: params.tableId,
  }),

  query_rows: (params) => ({
    tableId: params.tableId,
    filter: params.filter ? parseJSON(params.filter, 'Filter') : undefined,
    sort: params.sort ? parseJSON(params.sort, 'Sort') : undefined,
    limit: params.limit ? Number.parseInt(params.limit) : 100,
    offset: params.offset ? Number.parseInt(params.offset) : 0,
  }),
}

export const TableBlock: BlockConfig<TableQueryResponse> = {
  type: 'table',
  name: 'Table',
  description: 'User-defined data tables',
  longDescription:
    'Create and manage custom data tables. Store, query, and manipulate structured data within workflows.',
  docsLink: '#',
  category: 'blocks',
  bgColor: '#10B981',
  icon: TableIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Query Rows', id: 'query_rows' },
        { label: 'Insert Row', id: 'insert_row' },
        { label: 'Upsert Row', id: 'upsert_row' },
        { label: 'Batch Insert Rows', id: 'batch_insert_rows' },
        { label: 'Update Rows by Filter', id: 'update_rows_by_filter' },
        { label: 'Delete Rows by Filter', id: 'delete_rows_by_filter' },
        { label: 'Update Row by ID', id: 'update_row' },
        { label: 'Delete Row by ID', id: 'delete_row' },
        { label: 'Get Row by ID', id: 'get_row' },
        { label: 'Get Schema', id: 'get_schema' },
      ],
      value: () => 'query_rows',
    },

    // Table ID (for all operations)
    {
      id: 'tableId',
      title: 'Table ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter table ID',
      required: true,
    },

    // Row ID for get/update/delete
    {
      id: 'rowId',
      title: 'Row ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'row_xxxxx',
      condition: { field: 'operation', value: ['get_row', 'update_row', 'delete_row'] },
      required: true,
    },

    // Insert/Update/Upsert Row data (single row)
    {
      id: 'data',
      title: 'Row Data (JSON)',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: '{"column_name": "value"}',
      condition: {
        field: 'operation',
        value: ['insert_row', 'upsert_row', 'update_row', 'update_rows_by_filter'],
      },
      required: true,
      wandConfig: {
        enabled: true,
        maintainHistory: true,
        prompt: `Generate row data as a JSON object matching the table's column schema.

### CONTEXT
{context}

### INSTRUCTION
Return ONLY a valid JSON object with field values based on the table's columns. No explanations or markdown.

### EXAMPLES

Table with columns: email (string), name (string), age (number)
"user with email john@example.com and age 25"
→ {"email": "john@example.com", "name": "John", "age": 25}

Return ONLY the data JSON:`,
      },
    },

    // Batch Insert - multiple rows
    {
      id: 'rows',
      title: 'Rows Data (Array of JSON)',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: '[{"col1": "val1"}, {"col1": "val2"}]',
      condition: { field: 'operation', value: 'batch_insert_rows' },
      required: true,
      wandConfig: {
        enabled: true,
        maintainHistory: true,
        prompt: `Generate an array of row data objects matching the table's column schema.

### CONTEXT
{context}

### INSTRUCTION
Return ONLY a valid JSON array of objects. Each object represents one row. No explanations or markdown.
Maximum ${TABLE_LIMITS.MAX_BATCH_INSERT_SIZE} rows per batch.

### EXAMPLES

Table with columns: email (string), name (string), age (number)
"3 users: john@example.com age 25, jane@example.com age 30, bob@example.com age 28"
→ [
  {"email": "john@example.com", "name": "John", "age": 25},
  {"email": "jane@example.com", "name": "Jane", "age": 30},
  {"email": "bob@example.com", "name": "Bob", "age": 28}
]

Return ONLY the rows array:`,
      },
    },

    // Filter for update/delete by filter operations
    {
      id: 'filter',
      title: 'Filter (JSON)',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: '{"column_name": {"$eq": "value"}}',
      condition: {
        field: 'operation',
        value: ['update_rows_by_filter', 'delete_rows_by_filter'],
      },
      required: true,
      wandConfig: {
        enabled: true,
        maintainHistory: true,
        prompt: `Generate filter criteria for selecting rows in a table.

### CONTEXT
{context}

### INSTRUCTION
Return ONLY a valid JSON filter object. No explanations or markdown.

### OPERATORS
- **$eq**: Equals - {"column": {"$eq": "value"}} or {"column": "value"}
- **$ne**: Not equals - {"column": {"$ne": "value"}}
- **$gt**: Greater than - {"column": {"$gt": 18}}
- **$gte**: Greater than or equal - {"column": {"$gte": 100}}
- **$lt**: Less than - {"column": {"$lt": 90}}
- **$lte**: Less than or equal - {"column": {"$lte": 5}}
- **$in**: In array - {"column": {"$in": ["value1", "value2"]}}
- **$nin**: Not in array - {"column": {"$nin": ["value1", "value2"]}}
- **$contains**: String contains - {"column": {"$contains": "text"}}

### EXAMPLES

"rows where status is active"
→ {"status": "active"}

"rows where age is over 18 and status is pending"
→ {"age": {"$gte": 18}, "status": "pending"}

Return ONLY the filter JSON:`,
      },
    },

    // Filter for query_rows
    {
      id: 'filter',
      title: 'Filter (JSON)',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: '{"column_name": {"$eq": "value"}}',
      condition: { field: 'operation', value: 'query_rows' },
      wandConfig: {
        enabled: true,
        maintainHistory: true,
        prompt: `Generate filter criteria for selecting rows in a table.

### CONTEXT
{context}

### INSTRUCTION
Return ONLY a valid JSON filter object. No explanations or markdown.

### OPERATORS
- **$eq**: Equals - {"column": {"$eq": "value"}} or {"column": "value"}
- **$ne**: Not equals - {"column": {"$ne": "value"}}
- **$gt**: Greater than - {"column": {"$gt": 18}}
- **$gte**: Greater than or equal - {"column": {"$gte": 100}}
- **$lt**: Less than - {"column": {"$lt": 90}}
- **$lte**: Less than or equal - {"column": {"$lte": 5}}
- **$in**: In array - {"column": {"$in": ["value1", "value2"]}}
- **$nin**: Not in array - {"column": {"$nin": ["value1", "value2"]}}
- **$contains**: String contains - {"column": {"$contains": "text"}}

Return ONLY the filter JSON:`,
      },
    },

    // Sort for query_rows
    {
      id: 'sort',
      title: 'Sort (JSON)',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: '{"column_name": "desc"}',
      condition: { field: 'operation', value: 'query_rows' },
      wandConfig: {
        enabled: true,
        maintainHistory: true,
        prompt: `Generate sort order for table query results.

### CONTEXT
{context}

### INSTRUCTION
Return ONLY a valid JSON object specifying sort order. No explanations or markdown.

### FORMAT
{"column_name": "asc" or "desc"}

### EXAMPLES
"sort by newest first" → {"createdAt": "desc"}
"sort by age descending, then name ascending" → {"age": "desc", "name": "asc"}

Return ONLY the sort JSON:`,
      },
    },

    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '100',
      condition: {
        field: 'operation',
        value: ['query_rows', 'update_rows_by_filter', 'delete_rows_by_filter'],
      },
    },
    {
      id: 'offset',
      title: 'Offset',
      type: 'short-input',
      layout: 'half',
      placeholder: '0',
      condition: { field: 'operation', value: 'query_rows' },
      value: () => '0',
    },
  ],

  tools: {
    access: [
      'table_insert_row',
      'table_batch_insert_rows',
      'table_upsert_row',
      'table_update_row',
      'table_update_rows_by_filter',
      'table_delete_row',
      'table_delete_rows_by_filter',
      'table_query_rows',
      'table_get_row',
      'table_get_schema',
    ],
    config: {
      tool: (params) => {
        const toolMap: Record<string, string> = {
          insert_row: 'table_insert_row',
          batch_insert_rows: 'table_batch_insert_rows',
          upsert_row: 'table_upsert_row',
          update_row: 'table_update_row',
          update_rows_by_filter: 'table_update_rows_by_filter',
          delete_row: 'table_delete_row',
          delete_rows_by_filter: 'table_delete_rows_by_filter',
          query_rows: 'table_query_rows',
          get_row: 'table_get_row',
          get_schema: 'table_get_schema',
        }
        return toolMap[params.operation] || 'table_query_rows'
      },
      params: (params) => {
        const { operation, ...rest } = params
        const transformer = paramTransformers[operation]
        const transformed = transformer ? transformer(rest as TableBlockParams) : rest
        // Preserve `_context` (workspaceId / workflowId) — the per-operation transformers above
        // return a curated object that drops it, but the tool bodies (e.g. batch_insert_rows) need
        // it to resolve the workspace, otherwise they throw "Workspace ID is required".
        return rest._context ? { ...transformed, _context: rest._context } : transformed
      },
    },
  },

  inputs: {
    operation: { type: 'string', description: 'Table operation to perform' },
    tableId: { type: 'string', description: 'Table identifier' },
    data: { type: 'json', description: 'Row data for insert/update' },
    rows: { type: 'json', description: 'Array of row data for batch insert' },
    rowId: { type: 'string', description: 'Row identifier for ID-based operations' },
    filter: { type: 'json', description: 'Filter criteria for query/update/delete operations' },
    sort: { type: 'json', description: 'Sort order (JSON)' },
    limit: { type: 'number', description: 'Query or bulk operation limit' },
    offset: { type: 'number', description: 'Query result offset' },
  },

  outputs: {
    success: { type: 'boolean', description: 'Operation success status' },
    row: {
      type: 'json',
      description: 'Single row data (get_row, insert_row, upsert_row, update_row)',
    },
    operation: {
      type: 'string',
      description: 'Operation performed (insert or update) — upsert_row only',
    },
    rows: { type: 'json', description: 'Array of rows (query_rows, batch_insert_rows)' },
    rowCount: { type: 'number', description: 'Number of rows returned (query_rows)' },
    totalCount: { type: 'number', description: 'Total rows matching filter (query_rows)' },
    insertedCount: { type: 'number', description: 'Number of rows inserted (batch_insert_rows)' },
    updatedCount: { type: 'number', description: 'Number of rows updated (update_rows_by_filter)' },
    updatedRowIds: { type: 'json', description: 'IDs of updated rows (update_rows_by_filter)' },
    deletedCount: {
      type: 'number',
      description: 'Number of rows deleted (delete_row, delete_rows_by_filter)',
    },
    deletedRowIds: { type: 'json', description: 'IDs of deleted rows (delete_rows_by_filter)' },
    name: { type: 'string', description: 'Table name (get_schema)' },
    columns: { type: 'json', description: 'Column definitions (get_schema)' },
    message: { type: 'string', description: 'Operation status message' },
  },
}
