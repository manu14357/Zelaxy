import type { GetIncidentParams, RootlyObjectResponse } from '@/tools/rootly/types'
import type { ToolConfig } from '@/tools/types'

export const getIncidentTool: ToolConfig<GetIncidentParams, RootlyObjectResponse> = {
  id: 'rootly_get_incident',
  name: 'Rootly Get Incident',
  description: 'Get a single incident by ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Rootly API key',
    },
    incidentId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the incident to retrieve',
    },
  },

  request: {
    url: (params) => `https://api.rootly.com/v1/incidents/${params.incidentId}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
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
    data: { type: 'json', description: 'The incident object' },
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
