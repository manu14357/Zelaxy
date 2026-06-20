import type { CreateIncidentParams, PagerDutyObjectResponse } from '@/tools/pagerduty/types'
import type { ToolConfig } from '@/tools/types'

export const createIncidentTool: ToolConfig<CreateIncidentParams, PagerDutyObjectResponse> = {
  id: 'pagerduty_create_incident',
  name: 'PagerDuty Create Incident',
  description: 'Create a new incident in PagerDuty',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'PagerDuty REST API key',
    },
    email: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Email of the user creating the incident (From header)',
    },
    title: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'A short title describing the incident',
    },
    serviceId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the service the incident belongs to',
    },
  },

  request: {
    url: () => 'https://api.pagerduty.com/incidents',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Token token=${params.apiKey}`,
      'Content-Type': 'application/json',
      From: params.email,
    }),
    body: (params) => ({
      incident: {
        type: 'incident',
        title: params.title,
        service: { id: params.serviceId, type: 'service_reference' },
      },
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
    data: { type: 'json', description: 'The created incident object' },
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
