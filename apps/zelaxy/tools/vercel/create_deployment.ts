import type { ToolConfig } from '@/tools/types'
import type { VercelCreateDeploymentParams, VercelObjectResponse } from '@/tools/vercel/types'

export const createDeploymentTool: ToolConfig<VercelCreateDeploymentParams, VercelObjectResponse> =
  {
    id: 'vercel_create_deployment',
    name: 'Vercel Create Deployment',
    description: 'Create a new Vercel deployment from a Git source',
    version: '1.0.0',

    params: {
      apiKey: {
        type: 'string',
        required: true,
        visibility: 'user-only',
        description: 'Vercel access token',
      },
      name: {
        type: 'string',
        required: true,
        visibility: 'user-or-llm',
        description: 'Project name for the deployment',
      },
      project: {
        type: 'string',
        required: false,
        visibility: 'user-or-llm',
        description: 'Project ID (overrides name for project lookup)',
      },
      target: {
        type: 'string',
        required: false,
        visibility: 'user-or-llm',
        description: 'Target environment: production or staging',
      },
      gitSource: {
        type: 'json',
        required: false,
        visibility: 'user-or-llm',
        description:
          'Git source to deploy, e.g. {"type":"github","repo":"owner/repo","ref":"main"}',
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
        const url = new URL('https://api.vercel.com/v13/deployments')
        if (params.teamId) url.searchParams.append('teamId', params.teamId)
        return url.toString()
      },
      method: 'POST',
      headers: (params) => ({
        Authorization: `Bearer ${params.apiKey}`,
        'Content-Type': 'application/json',
      }),
      body: (params) => {
        const body: Record<string, any> = { name: params.name }
        if (params.project) body.project = params.project
        if (params.target) body.target = params.target
        if (params.gitSource) body.gitSource = params.gitSource
        return body
      },
    },

    transformResponse: async (response) => {
      const data = await response.json()
      return {
        success: true,
        output: { data, metadata: { id: data.id, name: data.name } },
      }
    },

    outputs: {
      data: { type: 'json', description: 'The created Vercel deployment object' },
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
