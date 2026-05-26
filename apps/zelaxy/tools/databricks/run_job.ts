import type { ToolConfig } from '@/tools/types'
import { databricksHeaders, databricksHost, parseDatabricksResponse } from './utils'

export const databricksRunJobTool: ToolConfig = {
  id: 'databricks_run_job',
  name: 'Databricks Run Job',
  description: 'Trigger a one-time run of a Databricks job.',
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
      description: 'The ID of the job to run',
    },
  },

  request: {
    url: (params) => `https://${databricksHost(params.host)}/api/2.1/jobs/run-now`,
    method: 'POST',
    headers: databricksHeaders,
    body: (params) => ({ job_id: Number(params.jobId) }),
  },

  transformResponse: async (response: Response) => {
    const data = await parseDatabricksResponse(response)
    return {
      success: true,
      output: {
        runId: data.run_id,
        numberInJob: data.number_in_job ?? null,
      },
    }
  },

  outputs: {
    runId: { type: 'number', description: 'The run ID' },
    numberInJob: { type: 'number', description: 'Run number within the job', optional: true },
  },
}
