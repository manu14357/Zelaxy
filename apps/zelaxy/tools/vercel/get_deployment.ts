import type { ToolConfig } from '@/tools/types'
import type { VercelGetDeploymentParams, VercelObjectResponse } from '@/tools/vercel/types'

export const getDeploymentTool: ToolConfig<VercelGetDeploymentParams, VercelObjectResponse> = {
  id: 'vercel_get_deployment',
  name: 'Vercel Get Deployment',
  description: 'Get details of a specific Vercel deployment',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Vercel access token',
    },
    deploymentId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The unique deployment identifier or URL',
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
      const url = new URL(
        `https://api.vercel.com/v13/deployments/${encodeURIComponent(params.deploymentId)}`
      )
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
    return {
      success: true,
      output: { data, metadata: { id: data.id, name: data.name } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Vercel deployment object' },
    metadata: {
      type: 'json',
      description: 'Deployment identifiers',
      properties: {
        id: { type: 'string', description: 'Deployment ID' },
        name: { type: 'string', description: 'Deployment name' },
      },
    },
  },
}
