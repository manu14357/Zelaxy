import type { GetIncidentParams, PagerDutyObjectResponse } from '@/tools/pagerduty/types'
import type { ToolConfig } from '@/tools/types'

export const getIncidentTool: ToolConfig<GetIncidentParams, PagerDutyObjectResponse> = {
  id: 'pagerduty_get_incident',
  name: 'PagerDuty Get Incident',
  description: 'Get a single incident by ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'PagerDuty REST API key',
    },
    incidentId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the incident to retrieve',
    },
  },

  request: {
    url: (params) => `https://api.pagerduty.com/incidents/${params.incidentId}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Token token=${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const incident = data.incident || data
    return {
      success: true,
      output: { data: incident, metadata: { id: incident.id, status: incident.status } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The incident object' },
    metadata: {
      type: 'json',
      description: 'Incident identifiers',
      properties: {
        id: { type: 'string', description: 'Incident ID' },
        status: { type: 'string', description: 'Incident status' },
      },
    },
  },
}
