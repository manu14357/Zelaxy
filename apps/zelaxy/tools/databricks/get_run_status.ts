import type { ToolConfig } from '@/tools/types'
import { databricksHost, parseDatabricksResponse } from './utils'

export const databricksGetRunStatusTool: ToolConfig = {
  id: 'databricks_get_run_status',
  name: 'Databricks Get Run Status',
  description: 'Get the status and details of a Databricks job run by its run ID.',
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
    jobId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The run ID to retrieve (returned by Run Job)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(`https://${databricksHost(params.host)}/api/2.1/jobs/runs/get`)
      url.searchParams.set('run_id', params.jobId)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Accept: 'application/json',
      Authorization: `Bearer ${params.token}`,
    }),
  },

  transformResponse: async (response: Response) => {
    const data = await parseDatabricksResponse(response)
    return {
      success: true,
      output: {
        runId: data.run_id ?? 0,
        jobId: data.job_id ?? 0,
        runName: data.run_name ?? '',
        lifeCycleState: data.state?.life_cycle_state ?? 'UNKNOWN',
        resultState: data.state?.result_state ?? null,
        stateMessage: data.state?.state_message ?? '',
        startTime: data.start_time ?? null,
        endTime: data.end_time ?? null,
        runPageUrl: data.run_page_url ?? '',
      },
    }
  },

  outputs: {
    runId: { type: 'number', description: 'Run ID' },
    jobId: { type: 'number', description: 'Job ID' },
    runName: { type: 'string', description: 'Run name' },
    lifeCycleState: { type: 'string', description: 'Run lifecycle state' },
    resultState: { type: 'string', description: 'Run result state', optional: true },
    stateMessage: { type: 'string', description: 'State message' },
    startTime: { type: 'number', description: 'Start time (epoch ms)', optional: true },
    endTime: { type: 'number', description: 'End time (epoch ms)', optional: true },
    runPageUrl: { type: 'string', description: 'URL to view the run in Databricks UI' },
  },
}
