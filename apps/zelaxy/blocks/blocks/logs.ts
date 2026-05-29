import type { SVGProps } from 'react'
import { createElement } from 'react'
import { Library } from 'lucide-react'
import type { BlockConfig } from '@/blocks/types'

const LogsIcon = (props: SVGProps<SVGSVGElement>) => createElement(Library, props)

export const LogsBlock: BlockConfig = {
  type: 'logs',
  name: 'Logs',
  description: 'Query workflow execution logs',
  longDescription:
    'Search workflow execution logs in the current workspace, fetch a single log by id, or load full execution details with the per-block state snapshot.',
  bgColor: '#EAB308',
  icon: LogsIcon,
  category: 'blocks',
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      options: [
        { label: 'Query Logs', id: 'query' },
        { label: 'Get Log by ID', id: 'get_log' },
        { label: 'Get Execution Details', id: 'get_execution' },
      ],
      placeholder: 'Select operation',
      value: () => 'query',
    },
    {
      id: 'workflowIds',
      title: 'Workflow IDs',
      type: 'short-input',
      placeholder: 'Comma-separated workflow IDs',
      condition: { field: 'operation', value: 'query' },
    },
    {
      id: 'executionId',
      title: 'Execution ID',
      type: 'short-input',
      placeholder: 'Filter by a single execution ID',
      condition: { field: 'operation', value: 'query' },
    },
    {
      id: 'level',
      title: 'Level',
      type: 'dropdown',
      options: [
        { label: 'All', id: 'all' },
        { label: 'Info', id: 'info' },
        { label: 'Error', id: 'error' },
        { label: 'Running', id: 'running' },
        { label: 'Pending', id: 'pending' },
      ],
      value: () => 'all',
      condition: { field: 'operation', value: 'query' },
    },
    {
      id: 'triggers',
      title: 'Triggers',
      type: 'short-input',
      placeholder: 'api,webhook,schedule,manual,chat',
      condition: { field: 'operation', value: 'query' },
    },
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      placeholder: '100 (max 200)',
      condition: { field: 'operation', value: 'query' },
    },
    {
      id: 'startDate',
      title: 'Start Date',
      type: 'short-input',
      placeholder: 'ISO 8601 timestamp',
      mode: 'advanced',
      condition: { field: 'operation', value: 'query' },
    },
    {
      id: 'endDate',
      title: 'End Date',
      type: 'short-input',
      placeholder: 'ISO 8601 timestamp',
      mode: 'advanced',
      condition: { field: 'operation', value: 'query' },
    },
    {
      id: 'search',
      title: 'Search',
      type: 'short-input',
      placeholder: 'Free-text search',
      mode: 'advanced',
      condition: { field: 'operation', value: 'query' },
    },
    {
      id: 'sortBy',
      title: 'Sort By',
      type: 'dropdown',
      options: [
        { label: 'Date', id: 'date' },
        { label: 'Duration', id: 'duration' },
        { label: 'Cost', id: 'cost' },
        { label: 'Status', id: 'status' },
      ],
      value: () => 'date',
      mode: 'advanced',
      condition: { field: 'operation', value: 'query' },
    },
    {
      id: 'sortOrder',
      title: 'Sort Order',
      type: 'dropdown',
      options: [
        { label: 'Descending', id: 'desc' },
        { label: 'Ascending', id: 'asc' },
      ],
      value: () => 'desc',
      mode: 'advanced',
      condition: { field: 'operation', value: 'query' },
    },
    {
      id: 'cursor',
      title: 'Cursor',
      type: 'short-input',
      placeholder: 'nextCursor from a previous response',
      mode: 'advanced',
      condition: { field: 'operation', value: 'query' },
    },
    {
      id: 'logId',
      title: 'Log ID',
      type: 'short-input',
      placeholder: 'Log entry ID',
      condition: { field: 'operation', value: 'get_log' },
      required: true,
    },
    {
      id: 'executionIdLookup',
      title: 'Execution ID',
      type: 'short-input',
      placeholder: 'Execution ID',
      condition: { field: 'operation', value: 'get_execution' },
      required: true,
    },
  ],
  tools: {
    access: ['logs_query', 'logs_get', 'logs_get_execution'],
    config: {
      tool: (params: Record<string, any>) => {
        const operation = params.operation || 'query'
        if (operation === 'get_log') return 'logs_get'
        if (operation === 'get_execution') return 'logs_get_execution'
        return 'logs_query'
      },
      params: (params: Record<string, any>) => {
        const operation = params.operation || 'query'

        if (operation === 'get_log') {
          return { id: params.logId }
        }

        if (operation === 'get_execution') {
          return { executionId: params.executionIdLookup }
        }

        const rawLimit =
          params.limit !== undefined && params.limit !== null && params.limit !== ''
            ? Number(params.limit)
            : undefined
        const limit = Number.isFinite(rawLimit) ? rawLimit : undefined

        return {
          workflowIds: params.workflowIds || undefined,
          executionId: params.executionId || undefined,
          level: params.level && params.level !== 'all' ? params.level : undefined,
          triggers: params.triggers || undefined,
          limit,
          startDate: params.startDate || undefined,
          endDate: params.endDate || undefined,
          search: params.search || undefined,
          sortBy: params.sortBy || undefined,
          sortOrder: params.sortOrder || undefined,
          cursor: params.cursor || undefined,
        }
      },
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    workflowIds: { type: 'string', description: 'Comma-separated workflow IDs' },
    executionId: { type: 'string', description: 'Filter by execution ID' },
    level: { type: 'string', description: 'Log level filter' },
    triggers: { type: 'string', description: 'Trigger type filter' },
    limit: { type: 'number', description: 'Max results (default 100, max 200)' },
    startDate: { type: 'string', description: 'Start date filter (ISO 8601)' },
    endDate: { type: 'string', description: 'End date filter (ISO 8601)' },
    search: { type: 'string', description: 'Free-text search' },
    sortBy: { type: 'string', description: 'Sort field' },
    sortOrder: { type: 'string', description: 'Sort direction (asc/desc)' },
    cursor: { type: 'string', description: 'Pagination cursor' },
    logId: { type: 'string', description: 'Log entry ID' },
    executionIdLookup: { type: 'string', description: 'Execution ID to look up' },
  },
  outputs: {
    logs: { type: 'json', description: 'Log entries' },
    total: { type: 'number', description: 'Total matching logs' },
    nextCursor: { type: 'string', description: 'Next pagination cursor' },
    log: { type: 'json', description: 'Single log entry (get_log)' },
    execution: { type: 'json', description: 'Execution details (get_execution)' },
  },
}
