import type { ToolConfig } from '@/tools/types'
import { dagsterHeaders, parseDagsterResponse } from './utils'

function buildLaunchRunMutation(hasConfig: boolean, hasTags: boolean) {
  const varDefs = [
    '$repositoryLocationName: String!',
    '$repositoryName: String!',
    '$jobName: String!',
  ]
  if (hasConfig) varDefs.push('$runConfigData: RunConfigData')
  if (hasTags) varDefs.push('$tags: [ExecutionTag!]')

  const execParams = [
    `selector: {
          repositoryLocationName: $repositoryLocationName
          repositoryName: $repositoryName
          jobName: $jobName
        }`,
  ]
  if (hasConfig) execParams.push('runConfigData: $runConfigData')
  if (hasTags) execParams.push('executionMetadata: { tags: $tags }')

  return `
    mutation LaunchRun(${varDefs.join(', ')}) {
      launchRun(
        executionParams: {
          ${execParams.join('\n          ')}
        }
      ) {
        type: __typename
        ... on LaunchRunSuccess { run { runId } }
        ... on InvalidStepError { invalidStepKey }
        ... on InvalidOutputError { stepKey invalidOutputName }
        ... on RunConfigValidationInvalid { errors { message } }
        ... on PipelineNotFoundError { message }
        ... on RunConflict { message }
        ... on UnauthorizedError { message }
        ... on PythonError { message }
      }
    }
  `
}

export const dagsterLaunchRunTool: ToolConfig = {
  id: 'dagster_launch_run',
  name: 'Dagster Launch Run',
  description: 'Launch a job run on a Dagster instance.',
  version: '1.0.0',

  params: {
    host: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Dagster host URL (e.g., https://myorg.dagster.cloud/prod)',
    },
    apiKey: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Dagster+ API token (leave blank for OSS)',
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
    jobName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Name of the job to launch',
    },
    runConfigJson: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Run configuration as a JSON object (optional)',
    },
    tags: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Tags as a JSON array of {key, value} objects (optional)',
    },
  },

  request: {
    url: (params) => `${params.host.replace(/\/$/, '')}/graphql`,
    method: 'POST',
    headers: dagsterHeaders,
    body: (params) => {
      const variables: Record<string, unknown> = {
        repositoryLocationName: params.repositoryLocationName,
        repositoryName: params.repositoryName,
        jobName: params.jobName,
      }
      let hasConfig = false
      if (params.runConfigJson) {
        variables.runConfigData = JSON.parse(params.runConfigJson)
        hasConfig = true
      }
      let hasTags = false
      if (params.tags) {
        variables.tags = JSON.parse(params.tags)
        hasTags = true
      }
      return { query: buildLaunchRunMutation(hasConfig, hasTags), variables }
    },
  },

  transformResponse: async (response: Response) => {
    const data = await parseDagsterResponse(response)
    const result = data.data?.launchRun as
      | {
          type: string
          run?: { runId: string }
          message?: string
          invalidStepKey?: string
          stepKey?: string
          invalidOutputName?: string
          errors?: Array<{ message: string }>
        }
      | undefined
    if (!result) throw new Error('Unexpected response from Dagster')
    if (result.type === 'LaunchRunSuccess' && result.run) {
      return { success: true, output: { runId: result.run.runId } }
    }
    if (result.type === 'InvalidStepError')
      throw new Error(`InvalidStepError: "${result.invalidStepKey}"`)
    if (result.type === 'RunConfigValidationInvalid')
      throw new Error(`Config invalid: ${result.errors?.map((e) => e.message).join('; ')}`)
    throw new Error(`${result.type}: ${result.message || 'Launch run failed'}`)
  },

  outputs: {
    runId: { type: 'string', description: 'The globally unique ID of the launched run' },
  },
}
