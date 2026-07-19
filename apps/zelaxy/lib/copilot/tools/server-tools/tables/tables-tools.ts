/**
 * Workspace data tools for ZelaxyArena (the workspace-wide assistant).
 *
 * These wrap the existing lib/table helpers and schedule queries so the agent can
 * create/query tables and inspect scheduled workflows by name. They are registered
 * in the shared copilot tool registry (so executeLocalTool can run them) but only
 * exposed to the ZelaxyArena agent — the in-editor Agie copilot is unaffected.
 */

import { and, eq, isNull } from 'drizzle-orm'
import {
  createTable,
  deleteRows,
  insertRow,
  listRows,
  listTables,
  TableConflictError,
  updateRow,
} from '@/lib/table'
import type { ColumnDefinition } from '@/lib/table/csv'
import { getBaseUrl } from '@/lib/urls/utils'
import { db } from '@/db'
import { apiKey, knowledgeBase, workflow, workflowSchedule } from '@/db/schema'
import type { ProviderToolConfig } from '@/providers/types'
import { BaseCopilotTool } from '../base'

const reqId = () => crypto.randomUUID().slice(0, 8)

async function resolveTableByName(workspaceId: string, tableName: string) {
  const tables = await listTables(workspaceId)
  const target = tables.find((t) => t.name.toLowerCase() === tableName.toLowerCase())
  return target ?? null
}

async function resolveWorkflowByName(workspaceId: string, name: string) {
  const rows = await db
    .select({ id: workflow.id, name: workflow.name })
    .from(workflow)
    .where(eq(workflow.workspaceId, workspaceId))
    .limit(500)
  return rows.find((w) => w.name.toLowerCase() === name.toLowerCase()) ?? null
}

// ── list_tables ──────────────────────────────────────────────────────────────
class ListTablesTool extends BaseCopilotTool<{ workspaceId: string }, any> {
  readonly id = 'list_tables'
  readonly displayName = 'Listing tables'
  protected async executeImpl(params: { workspaceId: string }) {
    const tables = await listTables(params.workspaceId)
    return {
      tables: tables.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        rowCount: t.rowCount,
        columns: t.schema?.columns?.map((c) => ({ name: c.name, type: c.type })) ?? [],
      })),
    }
  }
}

// ── query_table ──────────────────────────────────────────────────────────────
class QueryTableTool extends BaseCopilotTool<
  { workspaceId: string; tableName: string; limit?: number },
  any
> {
  readonly id = 'query_table'
  readonly displayName = 'Querying table'
  protected async executeImpl(params: { workspaceId: string; tableName: string; limit?: number }) {
    const table = await resolveTableByName(params.workspaceId, params.tableName)
    if (!table) throw new Error(`Table not found: ${params.tableName}`)
    const { rows, totalCount } = await listRows({
      tableId: table.id,
      limit: Math.min(params.limit ?? 50, 200),
    })
    return {
      table: table.name,
      totalCount,
      // Include the row id (as `_rowId`) so the agent can update/delete specific rows.
      rows: rows.map((r) => ({ _rowId: r.id, ...(r.data as Record<string, any>) })),
    }
  }
}

// ── create_table ─────────────────────────────────────────────────────────────
interface CreateTableParams {
  workspaceId: string
  userId: string
  name: string
  description?: string
  columns: Array<{ name: string; type: string; required?: boolean }>
}
class CreateTableTool extends BaseCopilotTool<CreateTableParams, any> {
  readonly id = 'create_table'
  readonly displayName = 'Creating table'
  protected async executeImpl(params: CreateTableParams) {
    // Idempotent by name: the agent has no cross-turn memory of what it already created (each chat
    // message is a fresh request), so it can legitimately re-propose a table it made earlier — e.g.
    // after re-reading a workflow block, or in a later turn of the same conversation. Reusing the
    // existing table (rather than throwing the DB's hard "already exists" conflict) lets the agent
    // proceed instead of surfacing a dead-end error mid-task.
    const existing = await resolveTableByName(params.workspaceId, params.name)
    if (existing) {
      return {
        id: existing.id,
        name: existing.name,
        columns: (existing.schema?.columns ?? []).map((c: any) => c.name),
        reused: true,
        note: `A table named "${existing.name}" already exists — reusing it instead of creating a duplicate.`,
      }
    }

    const columns: ColumnDefinition[] = (params.columns || []).map((c) => ({
      name: c.name,
      type: c.type as ColumnDefinition['type'],
      required: c.required ?? false,
    }))
    try {
      const table = await createTable(
        {
          name: params.name,
          description: params.description ?? null,
          schema: { columns },
          workspaceId: params.workspaceId,
          userId: params.userId,
        },
        reqId()
      )
      return { id: table.id, name: table.name, columns: columns.map((c) => c.name) }
    } catch (error) {
      // Narrow race: another call created the same-named table between the check above and this
      // insert. Same graceful reuse instead of a hard failure.
      if (error instanceof TableConflictError) {
        const nowExisting = await resolveTableByName(params.workspaceId, params.name)
        if (nowExisting) {
          return {
            id: nowExisting.id,
            name: nowExisting.name,
            columns: (nowExisting.schema?.columns ?? []).map((c: any) => c.name),
            reused: true,
            note: `A table named "${nowExisting.name}" already exists — reusing it instead of creating a duplicate.`,
          }
        }
      }
      throw error
    }
  }
}

// ── insert_table_row ─────────────────────────────────────────────────────────
interface InsertRowParams {
  workspaceId: string
  userId: string
  tableName: string
  row: Record<string, any>
}
class InsertTableRowTool extends BaseCopilotTool<InsertRowParams, any> {
  readonly id = 'insert_table_row'
  readonly displayName = 'Adding row'
  protected async executeImpl(params: InsertRowParams) {
    const table = await resolveTableByName(params.workspaceId, params.tableName)
    if (!table) throw new Error(`Table not found: ${params.tableName}`)
    const inserted = await insertRow(
      {
        tableId: table.id,
        workspaceId: params.workspaceId,
        userId: params.userId,
        data: params.row || {},
      },
      reqId()
    )
    return { id: inserted.id, table: table.name, data: inserted.data }
  }
}

// ── list_scheduled_jobs ──────────────────────────────────────────────────────
class ListScheduledJobsTool extends BaseCopilotTool<{ workspaceId: string }, any> {
  readonly id = 'list_scheduled_jobs'
  readonly displayName = 'Listing scheduled jobs'
  protected async executeImpl(params: { workspaceId: string }) {
    const rows = await db
      .select({
        id: workflowSchedule.id,
        workflowName: workflow.name,
        cronExpression: workflowSchedule.cronExpression,
        status: workflowSchedule.status,
        nextRunAt: workflowSchedule.nextRunAt,
        lastRanAt: workflowSchedule.lastRanAt,
        failedCount: workflowSchedule.failedCount,
      })
      .from(workflowSchedule)
      .innerJoin(workflow, eq(workflowSchedule.workflowId, workflow.id))
      .where(eq(workflow.workspaceId, params.workspaceId))
      .limit(100)
    return { schedules: rows }
  }
}

// ── update_table_row ─────────────────────────────────────────────────────────
interface UpdateRowParams {
  workspaceId: string
  tableName: string
  rowId: string
  row: Record<string, any>
}
class UpdateTableRowTool extends BaseCopilotTool<UpdateRowParams, any> {
  readonly id = 'update_table_row'
  readonly displayName = 'Updating row'
  protected async executeImpl(params: UpdateRowParams) {
    const table = await resolveTableByName(params.workspaceId, params.tableName)
    if (!table) throw new Error(`Table not found: ${params.tableName}`)
    const updated = await updateRow(table.id, params.rowId, params.row || {}, reqId())
    return { id: updated.id, table: table.name, data: updated.data }
  }
}

// ── delete_table_rows ────────────────────────────────────────────────────────
interface DeleteRowsParams {
  workspaceId: string
  tableName: string
  rowIds: string[]
}
class DeleteTableRowsTool extends BaseCopilotTool<DeleteRowsParams, any> {
  readonly id = 'delete_table_rows'
  readonly displayName = 'Deleting rows'
  protected async executeImpl(params: DeleteRowsParams) {
    const table = await resolveTableByName(params.workspaceId, params.tableName)
    if (!table) throw new Error(`Table not found: ${params.tableName}`)
    const ids = Array.isArray(params.rowIds) ? params.rowIds : []
    if (ids.length === 0) throw new Error('rowIds must be a non-empty array of row ids')
    const deleted = await deleteRows(table.id, ids, reqId())
    return { table: table.name, deletedCount: deleted }
  }
}

// ── export_table (CSV) ───────────────────────────────────────────────────────
class ExportTableTool extends BaseCopilotTool<{ workspaceId: string; tableName: string }, any> {
  readonly id = 'export_table'
  readonly displayName = 'Exporting table'
  protected async executeImpl(params: { workspaceId: string; tableName: string }) {
    const table = await resolveTableByName(params.workspaceId, params.tableName)
    if (!table) throw new Error(`Table not found: ${params.tableName}`)
    const cols = (table.schema?.columns ?? []).map((c) => c.name)
    const { rows } = await listRows({ tableId: table.id, limit: 10000 })
    const escapeCell = (v: unknown) => {
      const s =
        v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const header = cols.join(',')
    const lines = rows.map((r) => cols.map((c) => escapeCell((r.data as any)?.[c])).join(','))
    const csv = [header, ...lines].join('\n')
    return { table: table.name, rowCount: rows.length, csv }
  }
}

// ── rename_workflow ──────────────────────────────────────────────────────────
class RenameWorkflowTool extends BaseCopilotTool<
  { workspaceId: string; name: string; newName: string },
  any
> {
  readonly id = 'rename_workflow'
  readonly displayName = 'Renaming workflow'
  protected async executeImpl(params: { workspaceId: string; name: string; newName: string }) {
    const wf = await resolveWorkflowByName(params.workspaceId, params.name)
    if (!wf) throw new Error(`Workflow not found: ${params.name}`)
    await db
      .update(workflow)
      .set({ name: params.newName, updatedAt: new Date() })
      .where(eq(workflow.id, wf.id))
    return { id: wf.id, oldName: wf.name, newName: params.newName }
  }
}

// ── delete_workflow ──────────────────────────────────────────────────────────
class DeleteWorkflowTool extends BaseCopilotTool<{ workspaceId: string; name: string }, any> {
  readonly id = 'delete_workflow'
  readonly displayName = 'Deleting workflow'
  protected async executeImpl(params: { workspaceId: string; name: string }) {
    const wf = await resolveWorkflowByName(params.workspaceId, params.name)
    if (!wf) throw new Error(`Workflow not found: ${params.name}`)
    // Child rows (blocks, edges, schedules, webhooks, deployments…) cascade on delete.
    await db.delete(workflow).where(eq(workflow.id, wf.id))
    return { deleted: true, id: wf.id, name: wf.name }
  }
}

// ── run_workflow ─────────────────────────────────────────────────────────────
interface RunWorkflowParams {
  workspaceId: string
  userId: string
  name: string
  input?: Record<string, any>
}
class RunWorkflowTool extends BaseCopilotTool<RunWorkflowParams, any> {
  readonly id = 'run_workflow'
  readonly displayName = 'Running workflow'
  protected async executeImpl(params: RunWorkflowParams) {
    const rows = await db
      .select({ id: workflow.id, name: workflow.name, isDeployed: workflow.isDeployed })
      .from(workflow)
      .where(eq(workflow.workspaceId, params.workspaceId))
      .limit(500)
    const wf = rows.find((w) => w.name.toLowerCase() === params.name.toLowerCase())
    if (!wf) throw new Error(`Workflow not found: ${params.name}`)
    if (!wf.isDeployed) {
      throw new Error(
        `"${wf.name}" is not deployed. Deploy it as an API first, then it can be run from here.`
      )
    }

    const keys = await db
      .select({ key: apiKey.key })
      .from(apiKey)
      .where(eq(apiKey.userId, params.userId))
      .limit(1)
    if (!keys.length) {
      throw new Error('No API key found for your account. Create one in Settings → API Keys first.')
    }

    const res = await fetch(`${getBaseUrl()}/api/workflows/${wf.id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': keys[0].key },
      body: JSON.stringify(params.input ?? {}),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(
        `Workflow run failed (${res.status}): ${(data as any)?.error || res.statusText}`
      )
    }
    return { ok: true, workflow: wf.name, result: data }
  }
}

// ── create_knowledge_base ────────────────────────────────────────────────────
class CreateKnowledgeBaseTool extends BaseCopilotTool<
  { workspaceId: string; userId: string; name: string; description?: string },
  any
> {
  readonly id = 'create_knowledge_base'
  readonly displayName = 'Creating knowledge base'
  protected async executeImpl(params: {
    workspaceId: string
    userId: string
    name: string
    description?: string
  }) {
    const id = crypto.randomUUID()
    const now = new Date()
    await db.insert(knowledgeBase).values({
      id,
      userId: params.userId,
      workspaceId: params.workspaceId,
      name: params.name,
      description: params.description ?? null,
      tokenCount: 0,
      embeddingModel: 'text-embedding-3-small',
      embeddingDimension: 1536,
      chunkingConfig: { maxSize: 1024, minSize: 100, overlap: 200 },
      createdAt: now,
      updatedAt: now,
    })
    return {
      id,
      name: params.name,
      note: 'Knowledge base created. Adding documents and semantic search require the pgvector extension.',
    }
  }
}

// ── list_knowledge_bases ─────────────────────────────────────────────────────
class ListKnowledgeBasesTool extends BaseCopilotTool<{ workspaceId: string }, any> {
  readonly id = 'list_knowledge_bases'
  readonly displayName = 'Listing knowledge bases'
  protected async executeImpl(params: { workspaceId: string }) {
    const rows = await db
      .select({
        id: knowledgeBase.id,
        name: knowledgeBase.name,
        description: knowledgeBase.description,
        tokenCount: knowledgeBase.tokenCount,
      })
      .from(knowledgeBase)
      .where(
        and(eq(knowledgeBase.workspaceId, params.workspaceId), isNull(knowledgeBase.deletedAt))
      )
      .limit(100)
    return { knowledgeBases: rows }
  }
}

// ── http_request (direct action) ─────────────────────────────────────────────
interface HttpRequestParams {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: unknown
}
class HttpRequestTool extends BaseCopilotTool<HttpRequestParams, any> {
  readonly id = 'http_request'
  readonly displayName = 'Calling URL'
  protected async executeImpl(params: HttpRequestParams) {
    if (!/^https?:\/\//i.test(params.url)) {
      throw new Error('url must be an absolute http(s) URL')
    }
    const method = (params.method || 'GET').toUpperCase()
    const init: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json', ...(params.headers || {}) },
    }
    if (method !== 'GET' && method !== 'HEAD' && params.body !== undefined) {
      init.body = typeof params.body === 'string' ? params.body : JSON.stringify(params.body)
    }
    const res = await fetch(params.url, init)
    const text = await res.text()
    let parsed: unknown = text
    try {
      parsed = JSON.parse(text)
    } catch {
      // keep raw text
    }
    return { status: res.status, ok: res.ok, body: parsed }
  }
}

export const listTablesTool = new ListTablesTool()
export const queryTableTool = new QueryTableTool()
export const createTableTool = new CreateTableTool()
export const insertTableRowTool = new InsertTableRowTool()
export const updateTableRowTool = new UpdateTableRowTool()
export const deleteTableRowsTool = new DeleteTableRowsTool()
export const exportTableTool = new ExportTableTool()
export const listScheduledJobsTool = new ListScheduledJobsTool()
export const createKnowledgeBaseTool = new CreateKnowledgeBaseTool()
export const listKnowledgeBasesTool = new ListKnowledgeBasesTool()
export const httpRequestActionTool = new HttpRequestTool()
export const renameWorkflowTool = new RenameWorkflowTool()
export const deleteWorkflowTool = new DeleteWorkflowTool()
export const runWorkflowTool = new RunWorkflowTool()

/** LLM tool definitions exposed to the ZelaxyArena agent (not the in-editor copilot). */
export const ARENA_EXTRA_TOOL_DEFS: ProviderToolConfig[] = [
  {
    id: 'create_file',
    name: 'create_file',
    description:
      'Create a document/file in the workspace from text content (e.g. a report, notes, markdown, CSV). The file appears in Files. Use a descriptive name with an extension (e.g. "Research summary.md").',
    params: {},
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'File name including extension, e.g. "report.md"' },
        content: { type: 'string', description: 'The full text content of the file' },
      },
      required: ['name', 'content'],
    },
  },
  {
    id: 'append_file',
    name: 'append_file',
    description:
      'Append text to the end of an existing workspace file (by name). Creates it if it does not exist.',
    params: {},
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The name of the file to append to' },
        content: { type: 'string', description: 'The text to append' },
      },
      required: ['name', 'content'],
    },
  },
  {
    id: 'list_tables',
    name: 'list_tables',
    description: 'List all data tables in the workspace, with their columns and row counts.',
    params: {},
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    id: 'query_table',
    name: 'query_table',
    description: 'Read rows from a workspace table by its name. Returns up to `limit` rows.',
    params: {},
    parameters: {
      type: 'object',
      properties: {
        tableName: { type: 'string', description: 'The name of the table to query' },
        limit: { type: 'number', description: 'Max rows to return (default 50, max 200)' },
      },
      required: ['tableName'],
    },
  },
  {
    id: 'create_table',
    name: 'create_table',
    description:
      'Create a new workspace data table. Provide a name and a list of columns (name + type: string | number | boolean | date | json).',
    params: {},
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Table name' },
        description: { type: 'string', description: 'Optional description' },
        columns: {
          type: 'array',
          description: 'Column definitions',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['string', 'number', 'boolean', 'date', 'json'] },
              required: { type: 'boolean' },
            },
            required: ['name', 'type'],
          },
        },
      },
      required: ['name', 'columns'],
    },
  },
  {
    id: 'insert_table_row',
    name: 'insert_table_row',
    description:
      'Add a single row to a workspace table by name. `row` is an object of column→value.',
    params: {},
    parameters: {
      type: 'object',
      properties: {
        tableName: { type: 'string', description: 'The name of the table' },
        row: { type: 'object', description: 'Column-to-value map for the new row' },
      },
      required: ['tableName', 'row'],
    },
  },
  {
    id: 'update_table_row',
    name: 'update_table_row',
    description:
      'Update a single row in a table. Use query_table first to get each row’s `_rowId`, then pass it here with the changed fields.',
    params: {},
    parameters: {
      type: 'object',
      properties: {
        tableName: { type: 'string' },
        rowId: { type: 'string', description: 'The `_rowId` from query_table' },
        row: { type: 'object', description: 'Fields to update (column→value)' },
      },
      required: ['tableName', 'rowId', 'row'],
    },
  },
  {
    id: 'delete_table_rows',
    name: 'delete_table_rows',
    description:
      'Delete one or more rows from a table by their `_rowId` values (get them from query_table).',
    params: {},
    parameters: {
      type: 'object',
      properties: {
        tableName: { type: 'string' },
        rowIds: {
          type: 'array',
          items: { type: 'string' },
          description: '`_rowId` values to delete',
        },
      },
      required: ['tableName', 'rowIds'],
    },
  },
  {
    id: 'export_table',
    name: 'export_table',
    description: 'Export a table as CSV. Returns the CSV text and row count.',
    params: {},
    parameters: {
      type: 'object',
      properties: { tableName: { type: 'string' } },
      required: ['tableName'],
    },
  },
  {
    id: 'list_scheduled_jobs',
    name: 'list_scheduled_jobs',
    description: 'List scheduled (cron) workflows in the workspace, with status and next run time.',
    params: {},
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    id: 'create_knowledge_base',
    name: 'create_knowledge_base',
    description:
      'Create a new knowledge base in the workspace. (Adding documents and semantic search require the pgvector extension.)',
    params: {},
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Knowledge base name' },
        description: { type: 'string', description: 'Optional description' },
      },
      required: ['name'],
    },
  },
  {
    id: 'list_knowledge_bases',
    name: 'list_knowledge_bases',
    description: 'List the knowledge bases in the workspace with their document counts.',
    params: {},
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    id: 'http_request',
    name: 'http_request',
    description:
      'Take a direct action by making an HTTP request to an absolute URL (call a webhook or external API). Returns the status and response body.',
    params: {},
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Absolute http(s) URL to call' },
        method: { type: 'string', description: 'HTTP method (default GET)' },
        headers: { type: 'object', description: 'Optional request headers' },
        body: { description: 'Optional request body (object or string)' },
      },
      required: ['url'],
    },
  },
  {
    id: 'rename_workflow',
    name: 'rename_workflow',
    description: 'Rename a workflow in the workspace (match by current name).',
    params: {},
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Current workflow name' },
        newName: { type: 'string', description: 'New workflow name' },
      },
      required: ['name', 'newName'],
    },
  },
  {
    id: 'delete_workflow',
    name: 'delete_workflow',
    description:
      'Permanently delete a workflow (and its blocks, schedules, and deployments) by name. Confirm with the user before deleting.',
    params: {},
    parameters: {
      type: 'object',
      properties: { name: { type: 'string', description: 'Workflow name to delete' } },
      required: ['name'],
    },
  },
  {
    id: 'run_workflow',
    name: 'run_workflow',
    description:
      'Run a deployed workflow by name and return its result. The workflow must be deployed as an API. Optionally pass an input object.',
    params: {},
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Workflow name to run' },
        input: { type: 'object', description: 'Optional input payload for the run' },
      },
      required: ['name'],
    },
  },
]
