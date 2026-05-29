import type { ToolConfig, ToolResponse } from '@/tools/types'

interface LogsQueryParams {
  workflowIds?: string
  executionId?: string
  level?: string
  triggers?: string
  limit?: number
  cursor?: string
  sortBy?: string
  sortOrder?: string
  startDate?: string
  endDate?: string
  search?: string
  _context?: { workspaceId?: string; workflowId?: string }
}

interface LogsGetParams {
  id: string
  _context?: { workspaceId?: string }
}

interface LogsGetExecutionParams {
  executionId: string
}

interface LogsQueryResponse extends ToolResponse {
  output: { logs: any[]; nextCursor: string | null }
}

interface LogsGetResponse extends ToolResponse {
  output: { log: any }
}

interface LogsGetExecutionResponse extends ToolResponse {
  output: any
}

export const logsQueryTool: ToolConfig<LogsQueryParams, LogsQueryResponse> = {
  id: 'logs_query',
  name: 'Query Logs',
  description: 'Query workflow execution logs in the current workspace with filters.',
  version: '1.0.0',

  params: {
    workflowIds: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated workflow IDs to filter by',
    },
    executionId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter logs to a single execution ID',
    },
    level: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: "Log level filter: 'all', 'info', 'error', 'running', 'pending'",
    },
    triggers: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated triggers (api, webhook, schedule, manual, chat)',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Max logs to return (default 100, max 200)',
    },
    cursor: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Opaque pagination cursor returned by a previous query',
    },
    sortBy: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: "Sort field: 'date' (default), 'duration', 'cost', 'status'",
    },
    sortOrder: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: "Sort order: 'desc' (default) or 'asc'",
    },
    startDate: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'ISO 8601 timestamp; only logs at or after this time',
    },
    endDate: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'ISO 8601 timestamp; only logs at or before this time',
    },
    search: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Free-text search across log fields',
    },
  },

  request: {
    url: (params) => {
      const workspaceId = params._context?.workspaceId
      if (!workspaceId) throw new Error('workspaceId is required in execution context')
      const qs = new URLSearchParams({ workspaceId })
      if (params.workflowIds) qs.set('workflowIds', params.workflowIds)
      if (params.executionId) qs.set('executionId', params.executionId)
      if (params.level && params.level !== 'all') qs.set('level', params.level)
      if (params.triggers) qs.set('triggers', params.triggers)
      if (params.startDate) qs.set('startDate', params.startDate)
      if (params.endDate) qs.set('endDate', params.endDate)
      if (params.search) qs.set('search', params.search)
      if (params.cursor) qs.set('cursor', params.cursor)
      if (params.sortBy) qs.set('sortBy', params.sortBy)
      if (params.sortOrder) qs.set('sortOrder', params.sortOrder)
      if (params.limit !== undefined && params.limit !== null) qs.set('limit', String(params.limit))
      return `/api/logs?${qs.toString()}`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },

  transformResponse: async (response): Promise<LogsQueryResponse> => {
    const result = await response.json()
    if (!response.ok) throw new Error(result?.error || `Request failed with status ${response.status}`)
    return { success: true, output: { logs: result.data || [], nextCursor: result.nextCursor ?? null } }
  },

  outputs: {
    logs: { type: 'array', description: 'Array of workflow execution log entries' },
    nextCursor: { type: 'string', description: 'Pagination cursor for the next page; null when no more results' },
  },
}

export const logsGetTool: ToolConfig<LogsGetParams, LogsGetResponse> = {
  id: 'logs_get',
  name: 'Get Log by ID',
  description: 'Fetch a single workflow execution log entry by its log ID.',
  version: '1.0.0',

  params: {
    id: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Log entry ID',
    },
  },

  request: {
    url: (params) => {
      const workspaceId = params._context?.workspaceId
      if (!workspaceId) throw new Error('workspaceId is required in execution context')
      const qs = new URLSearchParams({ workspaceId })
      return `/api/logs/${encodeURIComponent(params.id)}?${qs.toString()}`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },

  transformResponse: async (response): Promise<LogsGetResponse> => {
    const result = await response.json()
    if (!response.ok) throw new Error(result?.error || `Request failed with status ${response.status}`)
    return { success: true, output: { log: result.data } }
  },

  outputs: {
    log: { type: 'json', description: 'Workflow execution log entry' },
  },
}

export const logsGetExecutionTool: ToolConfig<LogsGetExecutionParams, LogsGetExecutionResponse> = {
  id: 'logs_get_execution',
  name: 'Get Execution Details',
  description: 'Fetch full execution details for a workflow run, including the per-block state snapshot.',
  version: '1.0.0',

  params: {
    executionId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Execution ID returned by a workflow run',
    },
  },

  request: {
    url: (params) => `/api/logs/execution/${encodeURIComponent(params.executionId)}`,
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },

  transformResponse: async (response): Promise<LogsGetExecutionResponse> => {
    const data = await response.json()
    if (!response.ok) throw new Error(data?.error || `Request failed with status ${response.status}`)
    return { success: true, output: data }
  },

  outputs: {
    executionId: { type: 'string', description: 'Execution ID' },
    workflowId: { type: 'string', description: 'Workflow ID this execution belongs to' },
    workflowState: { type: 'json', description: 'Per-block state snapshot for the execution' },
    executionMetadata: { type: 'json', description: 'Trigger, timestamps, totalDurationMs, and cost for the run' },
  },
}
