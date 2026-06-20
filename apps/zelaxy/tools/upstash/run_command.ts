import type { ToolConfig } from '@/tools/types'
import type { UpstashResponse, UpstashRunCommandParams } from '@/tools/upstash/types'

export const runCommandTool: ToolConfig<UpstashRunCommandParams, UpstashResponse> = {
  id: 'upstash_run_command',
  name: 'Upstash Run Command',
  description: 'Run an arbitrary Redis command via the Upstash REST API',
  version: '1.0.0',

  params: {
    restUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Upstash Redis REST URL, e.g. https://xxx.upstash.io',
    },
    restToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Upstash Redis REST token',
    },
    command: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description: 'The Redis command as a JSON array, e.g. ["INCR","counter"]',
    },
  },

  request: {
    url: (params) => params.restUrl,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.restToken}`,
      'Content-Type': 'application/json',
    }),
    // The executor JSON.stringifies the returned body. Upstash expects a JSON array
    // (e.g. ["INCR","counter"]), so we return the array itself which stringifies correctly.
    body: (params) =>
      (Array.isArray(params.command) ? params.command : [params.command]) as unknown as Record<
        string,
        any
      >,
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { result: data.result } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Upstash response object ({ result })' },
    metadata: {
      type: 'json',
      description: 'Command metadata',
      properties: {
        result: { type: 'json', description: 'The result of the command' },
      },
    },
  },
}
