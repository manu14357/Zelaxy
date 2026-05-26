import type { ToolConfig } from '@/tools/types'
import { dagsterHeaders, parseDagsterResponse } from './utils'

function buildListRunsQuery(hasFilter: boolean) {
  return `
    query ListRuns($limit: Int${hasFilter ? ', $filter: RunsFilter' : ''}) {
      runsOrError(limit: $limit${hasFilter ? ', filter: $filter' : ''}) {
        ... on Runs {
          results { runId jobName status tags { key value } startTime endTime }
        }
        ... on InvalidPipelineRunsFilterError { __typename message }
        ... on PythonError { __typename message }
      }
    }
  `
}

export const dagsterListRunsTool: ToolConfig = {
  id: 'dagster_list_runs',
  name: 'Dagster List Runs',
  description: 'List recent Dagster runs, optionally filtered by job name or status.',
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
    jobName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter runs by job name (optional)',
    },
    statuses: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated run statuses to filter by, e.g. "SUCCESS,FAILURE"',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of runs to return (default 20)',
    },
  },

  request: {
    url: (params) => `${params.host.replace(/\/$/, '')}/graphql`,
    method: 'POST',
    headers: dagsterHeaders,
    body: (params) => {
      const filter: Record<string, unknown> = {}
      if (params.jobName) filter.pipelineName = params.jobName
      if (params.statuses) {
        filter.statuses = params.statuses
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      }
      const hasFilter = Object.keys(filter).length > 0
      const variables: Record<string, unknown> = { limit: params.limit || 20 }
      if (hasFilter) variables.filter = filter
      return { query: buildListRunsQuery(hasFilter), variables }
    },
  },

  transformResponse: async (response: Response) => {
    const data = await parseDagsterResponse(response)
    const result = data.data?.runsOrError
    if (!result || typeof result !== 'object') throw new Error('Unexpected response from Dagster')
    if (!('results' in result)) {
      throw new Error((result as { message?: string }).message || 'Failed to list runs')
    }
    const runs = (
      result as {
        results: Array<{
          runId: string
          jobName: string | null
          status: string
          tags: Array<{ key: string; value: string }> | null
          startTime: number | null
          endTime: number | null
        }>
      }
    ).results.map((r) => ({
      runId: r.runId,
      jobName: r.jobName ?? null,
      status: r.status,
      tags: r.tags ?? null,
      startTime: r.startTime ?? null,
      endTime: r.endTime ?? null,
    }))
    return { success: true, output: { runs } }
  },

  outputs: {
    runs: { type: 'json', description: 'Array of runs' },
  },
}
