import type { ToolConfig } from '@/tools/types'
import { dagsterHeaders, parseDagsterResponse } from './utils'

const TERMINATE_RUN_MUTATION = `
  mutation TerminateRun($runId: String!) {
    terminateRun(runId: $runId) {
      __typename
      ... on TerminateRunSuccess { run { runId } }
      ... on RunNotFoundError { message }
      ... on TerminateRunFailure { message }
      ... on UnauthorizedError { message }
      ... on PythonError { message }
    }
  }
`

export const dagsterTerminateRunTool: ToolConfig = {
  id: 'dagster_terminate_run',
  name: 'Dagster Terminate Run',
  description: 'Terminate a running Dagster run.',
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
      description: 'The ID of the run to terminate',
    },
  },

  request: {
    url: (params) => `${params.host.replace(/\/$/, '')}/graphql`,
    method: 'POST',
    headers: dagsterHeaders,
    body: (params) => ({ query: TERMINATE_RUN_MUTATION, variables: { runId: params.runId } }),
  },

  transformResponse: async (response: Response) => {
    const data = await parseDagsterResponse(response)
    const result = data.data?.terminateRun as
      | { __typename: string; run?: { runId: string }; message?: string }
      | undefined
    if (!result) throw new Error('Unexpected response from Dagster')
    if (result.__typename === 'TerminateRunSuccess' && result.run) {
      return { success: true, output: { runId: result.run.runId, status: 'TERMINATED' } }
    }
    throw new Error(`${result.__typename}: ${result.message || 'Terminate run failed'}`)
  },

  outputs: {
    runId: { type: 'string', description: 'Run ID that was terminated' },
    status: { type: 'string', description: 'Termination status' },
  },
}
