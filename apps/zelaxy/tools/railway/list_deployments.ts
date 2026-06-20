import type { RailwayListDeploymentsParams, RailwayListResponse } from '@/tools/railway/types'
import type { ToolConfig } from '@/tools/types'

export const listDeploymentsTool: ToolConfig<RailwayListDeploymentsParams, RailwayListResponse> = {
  id: 'railway_list_deployments',
  name: 'Railway List Deployments',
  description: 'List deployments for a Railway service in an environment',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Railway API token',
    },
    projectId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Railway project ID',
    },
    serviceId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Railway service ID',
    },
    environmentId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Railway environment ID',
    },
    first: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of deployments to return',
    },
  },

  request: {
    url: () => 'https://backboard.railway.app/graphql/v2',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      query: `query ListDeployments($input: DeploymentListInput!, $first: Int) {
        deployments(input: $input, first: $first) {
          edges {
            node {
              id
              status
              createdAt
              url
              staticUrl
            }
          }
        }
      }`,
      variables: {
        input: {
          projectId: params.projectId,
          serviceId: params.serviceId,
          environmentId: params.environmentId,
        },
        first: params.first ? Number(params.first) : 10,
      },
    }),
  },

  transformResponse: async (response) => {
    const json = await response.json()
    const edges = json.data?.deployments?.edges || []
    const deployments = edges.map((edge: any) => edge.node).filter(Boolean)
    return {
      success: true,
      output: { data: deployments, metadata: { count: deployments.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Railway deployment objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of deployments returned' },
      },
    },
  },
}
