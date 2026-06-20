import type { RailwayListProjectsParams, RailwayListResponse } from '@/tools/railway/types'
import type { ToolConfig } from '@/tools/types'

export const listProjectsTool: ToolConfig<RailwayListProjectsParams, RailwayListResponse> = {
  id: 'railway_list_projects',
  name: 'Railway List Projects',
  description: 'List Railway projects visible to the provided token',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Railway API token',
    },
    first: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of projects to return',
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
      query: `query ListProjects($first: Int) {
        projects(first: $first) {
          edges {
            node {
              id
              name
              description
              createdAt
            }
          }
        }
      }`,
      variables: { first: params.first ? Number(params.first) : 20 },
    }),
  },

  transformResponse: async (response) => {
    const json = await response.json()
    const edges = json.data?.projects?.edges || []
    const projects = edges.map((edge: any) => edge.node).filter(Boolean)
    return {
      success: true,
      output: { data: projects, metadata: { count: projects.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Railway project objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of projects returned' },
      },
    },
  },
}
