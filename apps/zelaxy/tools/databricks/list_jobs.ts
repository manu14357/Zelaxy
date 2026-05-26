import type { ToolConfig } from '@/tools/types'
import { databricksHeaders, databricksHost, parseDatabricksResponse } from './utils'

export const databricksListJobsTool: ToolConfig = {
  id: 'databricks_list_jobs',
  name: 'Databricks List Jobs',
  description: 'List all jobs in a Databricks workspace.',
  version: '1.0.0',

  params: {
    host: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Databricks workspace URL',
    },
    token: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Databricks Personal Access Token',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of jobs to return (default 20)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(`https://${databricksHost(params.host)}/api/2.1/jobs/list`)
      url.searchParams.set('limit', String(params.limit || 20))
      return url.toString()
    },
    method: 'GET',
    headers: databricksHeaders,
  },

  transformResponse: async (response: Response) => {
    const data = await parseDatabricksResponse(response)
    const jobs = (data.jobs ?? []).map((j: { job_id: number; settings?: { name?: string } }) => ({
      jobId: j.job_id,
      name: j.settings?.name ?? '',
    }))
    return { success: true, output: { jobs, hasMore: data.has_more ?? false } }
  },

  outputs: {
    jobs: { type: 'json', description: 'Array of job objects' },
    hasMore: { type: 'boolean', description: 'Whether there are more jobs to fetch' },
  },
}
