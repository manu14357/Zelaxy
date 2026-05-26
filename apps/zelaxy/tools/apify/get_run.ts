import type { ApifyGetRunParams, ApifyGetRunResult } from '@/tools/apify/types'
import type { ToolConfig } from '@/tools/types'

export const apifyGetRunTool: ToolConfig<ApifyGetRunParams, ApifyGetRunResult> = {
  id: 'apify_get_run',
  name: 'APIFY Get Run',
  description: 'Get the status and details of an APIFY actor run',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'APIFY API token',
    },
    actorId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Actor ID or username/actor-name',
    },
    runId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The run ID to fetch',
    },
  },

  request: {
    url: (params) =>
      `https://api.apify.com/v2/acts/${encodeURIComponent(params.actorId)}/runs/${params.runId}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
    }),
  },

  transformResponse: async (response) => {
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`APIFY API error: ${errorText}`)
    }
    const data = await response.json()
    const run = data.data
    return {
      success: true,
      output: {
        id: run.id,
        actId: run.actId,
        status: run.status,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        defaultDatasetId: run.defaultDatasetId,
      },
    }
  },

  outputs: {
    id: { type: 'string', description: 'Run ID' },
    actId: { type: 'string', description: 'Actor ID' },
    status: { type: 'string', description: 'Run status' },
    startedAt: { type: 'string', description: 'Start time' },
    finishedAt: { type: 'string', description: 'Finish time', optional: true },
    defaultDatasetId: { type: 'string', description: 'Default dataset ID' },
  },
}
