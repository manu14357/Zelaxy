import type { ToolConfig } from '@/tools/types'
import { dagsterHeaders, parseDagsterResponse } from './utils'

const GET_RUN_QUERY = `
  query GetRun($runId: ID!) {
    runOrError(runId: $runId) {
      ... on Run {
        runId jobName status startTime endTime runConfigYaml
        tags { key value }
      }
      ... on RunNotFoundError { __typename message }
      ... on PythonError { __typename message }
    }
  }
`

export const dagsterGetRunTool: ToolConfig = {
  id: 'dagster_get_run',
  name: 'Dagster Get Run',
  description: 'Get the status and details of a Dagster run by its ID.',
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
      description: 'The ID of the run to retrieve',
    },
  },

  request: {
    url: (params) => `${params.host.replace(/\/$/, '')}/graphql`,
    method: 'POST',
    headers: dagsterHeaders,
    body: (params) => ({ query: GET_RUN_QUERY, variables: { runId: params.runId } }),
  },

  transformResponse: async (response: Response) => {
    const data = await parseDagsterResponse(response)
    const raw = data.data?.runOrError
    if (!raw || typeof raw !== 'object') throw new Error('Unexpected response from Dagster')
    if (!('runId' in raw)) {
      throw new Error((raw as { message?: string }).message || 'Run not found')
    }
    const run = raw as {
      runId: string
      jobName: string | null
      status: string
      startTime: number | null
      endTime: number | null
      runConfigYaml: string | null
      tags: Array<{ key: string; value: string }> | null
    }
    return {
      success: true,
      output: {
        runId: run.runId,
        jobName: run.jobName ?? null,
        status: run.status,
        startTime: run.startTime ?? null,
        endTime: run.endTime ?? null,
        runConfigYaml: run.runConfigYaml ?? null,
        tags: run.tags ?? null,
      },
    }
  },

  outputs: {
    runId: { type: 'string', description: 'Run ID' },
    jobName: { type: 'string', description: 'Job name', optional: true },
    status: { type: 'string', description: 'Run status' },
    startTime: { type: 'number', description: 'Start time as Unix timestamp', optional: true },
    endTime: { type: 'number', description: 'End time as Unix timestamp', optional: true },
    runConfigYaml: { type: 'string', description: 'Run configuration as YAML', optional: true },
    tags: { type: 'json', description: 'Run tags', optional: true },
  },
}
