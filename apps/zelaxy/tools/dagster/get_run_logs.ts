import type { ToolConfig } from '@/tools/types'
import { dagsterHeaders, parseDagsterResponse } from './utils'

const GET_RUN_LOGS_QUERY = `
  query GetRunLogs($runId: ID!, $afterCursor: String, $limit: Int) {
    logsForRun(runId: $runId, afterCursor: $afterCursor, limit: $limit) {
      ... on EventConnection {
        events {
          __typename
          ... on MessageEvent { message timestamp level stepKey eventType }
        }
        cursor hasMore
      }
      ... on RunNotFoundError { __typename message }
      ... on PythonError { __typename message }
    }
  }
`

export const dagsterGetRunLogsTool: ToolConfig = {
  id: 'dagster_get_run_logs',
  name: 'Dagster Get Run Logs',
  description: 'Fetch execution event logs for a Dagster run.',
  version: '1.0.0',

  params: {
    host: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Dagster host URL',
    },
    apiKey: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Dagster+ API token',
    },
    runId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the run to fetch logs for',
    },
    afterCursor: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Cursor for paginating through log events',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of log events to return',
    },
  },

  request: {
    url: (params) => `${params.host.replace(/\/$/, '')}/graphql`,
    method: 'POST',
    headers: dagsterHeaders,
    body: (params) => {
      const variables: Record<string, unknown> = { runId: params.runId }
      if (params.afterCursor) variables.afterCursor = params.afterCursor
      if (params.limit != null) variables.limit = params.limit
      return { query: GET_RUN_LOGS_QUERY, variables }
    },
  },

  transformResponse: async (response: Response) => {
    const data = await parseDagsterResponse(response)
    const result = data.data?.logsForRun
    if (!result || typeof result !== 'object') throw new Error('Unexpected response from Dagster')
    if (!('events' in result)) {
      throw new Error((result as { message?: string }).message || 'Failed to fetch run logs')
    }
    const conn = result as {
      events: Array<{
        __typename?: string
        message?: string
        timestamp?: string
        level?: string
        stepKey?: string
        eventType?: string
      }>
      cursor?: string
      hasMore?: boolean
    }
    const events = (conn.events ?? []).map((e) => ({
      type: e.__typename ?? 'Unknown',
      message: e.message ?? '',
      timestamp: e.timestamp ?? '',
      level: e.level ?? 'INFO',
      stepKey: e.stepKey ?? null,
      eventType: e.eventType ?? null,
    }))
    return {
      success: true,
      output: {
        events,
        cursor: conn.cursor ?? null,
        hasMore: conn.hasMore ?? false,
      },
    }
  },

  outputs: {
    events: { type: 'json', description: 'Array of log events' },
    cursor: { type: 'string', description: 'Cursor for next page', optional: true },
    hasMore: { type: 'boolean', description: 'Whether more log events are available' },
  },
}
