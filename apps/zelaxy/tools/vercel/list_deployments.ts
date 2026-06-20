import type { ToolConfig } from '@/tools/types'
import type { VercelListDeploymentsParams, VercelListResponse } from '@/tools/vercel/types'

export const listDeploymentsTool: ToolConfig<VercelListDeploymentsParams, VercelListResponse> = {
  id: 'vercel_list_deployments',
  name: 'Vercel List Deployments',
  description: 'List deployments for a Vercel project or team',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Vercel access token',
    },
    projectId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter deployments by project ID or name',
    },
    target: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by environment: production or staging',
    },
    state: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by state: BUILDING, ERROR, INITIALIZING, QUEUED, READY, CANCELED',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of deployments to return',
    },
    teamId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Team ID to scope the request',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.vercel.com/v6/deployments')
      if (params.projectId) url.searchParams.append('projectId', params.projectId)
      if (params.target) url.searchParams.append('target', params.target)
      if (params.state) url.searchParams.append('state', params.state)
      if (params.limit) url.searchParams.append('limit', String(params.limit))
      if (params.teamId) url.searchParams.append('teamId', params.teamId)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const deployments = data.deployments || []
    return {
      success: true,
      output: {
        data: deployments,
        metadata: { count: deployments.length, hasMore: data.pagination?.next != null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Vercel deployment objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of deployments returned' },
        hasMore: {
          type: 'boolean',
          description: 'Whether more deployments exist beyond this page',
        },
      },
    },
  },
}
