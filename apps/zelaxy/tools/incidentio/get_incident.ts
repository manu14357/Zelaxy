import type { GetIncidentParams, IncidentioObjectResponse } from '@/tools/incidentio/types'
import type { ToolConfig } from '@/tools/types'

export const getIncidentTool: ToolConfig<GetIncidentParams, IncidentioObjectResponse> = {
  id: 'incidentio_get_incident',
  name: 'incident.io Get Incident',
  description: 'Get a single incident by ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'incident.io API key',
    },
    incidentId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the incident to retrieve',
    },
  },

  request: {
    url: (params) => `https://api.incident.io/v2/incidents/${params.incidentId}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const incident = data.incident || data
    return {
      success: true,
      output: { data: incident, metadata: { id: incident.id, reference: incident.reference } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The incident object' },
    metadata: {
      type: 'json',
      description: 'Incident identifiers',
      properties: {
        id: { type: 'string', description: 'Incident ID' },
        reference: { type: 'string', description: 'Incident reference' },
      },
    },
  },
}
