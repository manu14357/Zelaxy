import type { ApifyRunActorParams, ApifyRunActorResult } from '@/tools/apify/types'
import type { ToolConfig } from '@/tools/types'

export const apifyRunActorSyncTool: ToolConfig<ApifyRunActorParams, ApifyRunActorResult> = {
  id: 'apify_run_actor_sync',
  name: 'APIFY Run Actor (Sync)',
  description: 'Run an APIFY actor synchronously and get results (max 5 minutes)',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'APIFY API token from console.apify.com/account#/integrations',
    },
    actorId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description:
        'Actor ID or username/actor-name. Examples: "apify/web-scraper", "janedoe/my-actor"',
    },
    input: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Actor input as JSON string. Example: {"startUrls": [{"url": "https://example.com"}]}',
    },
    memory: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Memory in megabytes allocated for the actor run (128-32768)',
    },
    timeout: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Timeout in seconds for the actor run',
    },
    build: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Actor build to run. Examples: "latest", "beta"',
    },
  },

  request: {
    url: (params) => {
      const encodedActorId = encodeURIComponent(params.actorId)
      const baseUrl = `https://api.apify.com/v2/acts/${encodedActorId}/run-sync-get-dataset-items`
      const queryParams = new URLSearchParams()
      queryParams.set('token', params.apiKey)
      if (params.memory) queryParams.set('memory', params.memory.toString())
      if (params.timeout) queryParams.set('timeout', params.timeout.toString())
      if (params.build) queryParams.set('build', params.build)
      return `${baseUrl}?${queryParams.toString()}`
    },
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      if (!params.input) return {}
      try {
        return JSON.parse(params.input)
      } catch {
        throw new Error('Invalid JSON in input parameter')
      }
    },
  },

  transformResponse: async (response) => {
    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        output: { success: false, runId: '', status: 'ERROR', items: [] },
        error: `APIFY API error: ${errorText}`,
      }
    }
    const items = await response.json()
    return {
      success: true,
      output: {
        success: true,
        runId: 'sync-execution',
        status: 'SUCCEEDED',
        items,
      },
    }
  },

  outputs: {
    success: { type: 'boolean', description: 'Whether the actor run succeeded' },
    runId: { type: 'string', description: 'APIFY run ID' },
    status: { type: 'string', description: 'Run status (SUCCEEDED, FAILED, etc.)' },
    items: { type: 'array', description: 'Dataset items' },
  },
}
