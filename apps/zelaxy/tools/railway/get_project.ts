import type { RailwayGetProjectParams, RailwayObjectResponse } from '@/tools/railway/types'
import type { ToolConfig } from '@/tools/types'

export const getProjectTool: ToolConfig<RailwayGetProjectParams, RailwayObjectResponse> = {
  id: 'railway_get_project',
  name: 'Railway Get Project',
  description: 'Get a Railway project with its services and environments',
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
  },

  request: {
    url: () => 'https://backboard.railway.app/graphql/v2',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      query: `query GetProject($id: String!) {
        project(id: $id) {
          id
          name
          description
          createdAt
          services {
            edges {
              node {
                id
                name
              }
            }
          }
          environments {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }`,
      variables: { id: params.projectId },
    }),
  },

  transformResponse: async (response) => {
    const json = await response.json()
    const project = json.data?.project || {}
    return {
      success: true,
      output: { data: project, metadata: { id: project.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Railway project object' },
    metadata: {
      type: 'json',
      description: 'Project identifiers',
      properties: {
        id: { type: 'string', description: 'Project ID' },
      },
    },
  },
}
