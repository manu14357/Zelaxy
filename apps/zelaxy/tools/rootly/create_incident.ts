import type { CreateIncidentParams, RootlyObjectResponse } from '@/tools/rootly/types'
import type { ToolConfig } from '@/tools/types'

export const createIncidentTool: ToolConfig<CreateIncidentParams, RootlyObjectResponse> = {
  id: 'rootly_create_incident',
  name: 'Rootly Create Incident',
  description: 'Create a new incident in Rootly',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Rootly API key',
    },
    title: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The title of the incident',
    },
    summary: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'A summary describing the incident',
    },
  },

  request: {
    url: () => 'https://api.rootly.com/v1/incidents',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      data: {
        type: 'incidents',
        attributes: {
          title: params.title,
          summary: params.summary,
        },
      },
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const incident = data.data || data
    return {
      success: true,
      output: { data: incident, metadata: { id: incident.id, type: incident.type } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The created incident object' },
    metadata: {
      type: 'json',
      description: 'Incident identifiers',
      properties: {
        id: { type: 'string', description: 'Incident ID' },
        type: { type: 'string', description: 'Resource type' },
      },
    },
  },
}
