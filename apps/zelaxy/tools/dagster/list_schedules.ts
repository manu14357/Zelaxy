import type { ToolConfig } from '@/tools/types'
import { dagsterHeaders, parseDagsterResponse } from './utils'

function buildListSchedulesQuery(hasStatus: boolean) {
  return `
    query ListSchedules($repositorySelector: RepositorySelector!${hasStatus ? ', $scheduleStatus: InstigationStatus' : ''}) {
      schedulesOrError(repositorySelector: $repositorySelector${hasStatus ? ', scheduleStatus: $scheduleStatus' : ''}) {
        ... on Schedules {
          results {
            name cronSchedule pipelineName description executionTimezone
            scheduleState { id status }
          }
        }
        ... on RepositoryNotFoundError { __typename message }
        ... on PythonError { __typename message }
      }
    }
  `
}

export const dagsterListSchedulesTool: ToolConfig = {
  id: 'dagster_list_schedules',
  name: 'Dagster List Schedules',
  description: 'List all schedules in a Dagster repository.',
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
    repositoryLocationName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Repository location (code location) name',
    },
    repositoryName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Repository name within the code location',
    },
    scheduleStatus: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter schedules by status: RUNNING or STOPPED (omit to return all)',
    },
  },

  request: {
    url: (params) => `${params.host.replace(/\/$/, '')}/graphql`,
    method: 'POST',
    headers: dagsterHeaders,
    body: (params) => {
      const hasStatus = Boolean(params.scheduleStatus)
      const variables: Record<string, unknown> = {
        repositorySelector: {
          repositoryLocationName: params.repositoryLocationName,
          repositoryName: params.repositoryName,
        },
      }
      if (hasStatus) variables.scheduleStatus = params.scheduleStatus
      return { query: buildListSchedulesQuery(hasStatus), variables }
    },
  },

  transformResponse: async (response: Response) => {
    const data = await parseDagsterResponse(response)
    const result = data.data?.schedulesOrError
    if (!result || typeof result !== 'object') throw new Error('Unexpected response from Dagster')
    if (!('results' in result)) {
      throw new Error((result as { message?: string }).message || 'Failed to list schedules')
    }
    const schedules = (
      result as {
        results: Array<{
          name: string
          cronSchedule: string | null
          pipelineName: string | null
          description: string | null
          executionTimezone: string | null
          scheduleState?: { id: string; status: string } | null
        }>
      }
    ).results.map((s) => ({
      name: s.name,
      cronSchedule: s.cronSchedule ?? null,
      jobName: s.pipelineName ?? null,
      status: s.scheduleState?.status ?? 'UNKNOWN',
      id: s.scheduleState?.id ?? null,
      description: s.description ?? null,
      executionTimezone: s.executionTimezone ?? null,
    }))
    return { success: true, output: { schedules } }
  },

  outputs: {
    schedules: { type: 'json', description: 'Array of schedules' },
  },
}
