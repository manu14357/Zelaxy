import type { ToolConfig } from '@/tools/types'
import { dagsterHeaders, parseDagsterResponse } from './utils'

const LIST_JOBS_QUERY = `
  query ListJobNames {
    repositoriesOrError {
      ... on RepositoryConnection {
        nodes { name jobs { name } }
      }
      ... on RepositoryNotFoundError { __typename message }
      ... on PythonError { __typename message }
    }
  }
`

export const dagsterListJobsTool: ToolConfig = {
  id: 'dagster_list_jobs',
  name: 'Dagster List Jobs',
  description: 'List all jobs across repositories in a Dagster instance.',
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
  },

  request: {
    url: (params) => `${params.host.replace(/\/$/, '')}/graphql`,
    method: 'POST',
    headers: dagsterHeaders,
    body: () => ({ query: LIST_JOBS_QUERY, variables: {} }),
  },

  transformResponse: async (response: Response) => {
    const data = await parseDagsterResponse(response)
    const result = data.data?.repositoriesOrError
    if (!result || typeof result !== 'object') throw new Error('Unexpected response from Dagster')
    if (!('nodes' in result)) {
      throw new Error((result as { message?: string }).message || 'Failed to list jobs')
    }
    const jobs: Array<{ name: string; repositoryName: string }> = []
    for (const repo of (
      result as { nodes: Array<{ name: string; jobs?: Array<{ name: string }> }> }
    ).nodes) {
      for (const job of repo.jobs ?? []) {
        jobs.push({ name: job.name, repositoryName: repo.name })
      }
    }
    return { success: true, output: { jobs } }
  },

  outputs: {
    jobs: { type: 'json', description: 'Array of jobs with name and repositoryName' },
  },
}
