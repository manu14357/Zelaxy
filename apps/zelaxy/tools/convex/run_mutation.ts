import type { ConvexResponse, ConvexRunMutationParams } from '@/tools/convex/types'
import type { ToolConfig } from '@/tools/types'

export const runMutationTool: ToolConfig<ConvexRunMutationParams, ConvexResponse> = {
  id: 'convex_run_mutation',
  name: 'Convex Run Mutation',
  description: 'Run a Convex mutation function via the HTTP API',
  version: '1.0.0',

  params: {
    deploymentUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Convex deployment URL, e.g. https://xxx.convex.cloud',
    },
    adminKey: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Convex admin key (optional, required for admin-only functions)',
    },
    path: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The function path, e.g. messages:send',
    },
    args: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Arguments object passed to the function',
    },
  },

  request: {
    url: (params) => `${params.deploymentUrl}/api/mutation`,
    method: 'POST',
    headers: (params) => ({
      'Content-Type': 'application/json',
      ...(params.adminKey ? { Authorization: `Convex ${params.adminKey}` } : {}),
    }),
    body: (params) => ({
      path: params.path,
      args: params.args ?? {},
      format: 'json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { status: data.status } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Convex response object ({ status, value })' },
    metadata: {
      type: 'json',
      description: 'Mutation metadata',
      properties: {
        status: { type: 'string', description: 'Convex execution status (success/error)' },
      },
    },
  },
}
