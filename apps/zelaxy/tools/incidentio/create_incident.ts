import type { CreateIncidentParams, IncidentioObjectResponse } from '@/tools/incidentio/types'
import type { ToolConfig } from '@/tools/types'

export const createIncidentTool: ToolConfig<CreateIncidentParams, IncidentioObjectResponse> = {
  id: 'incidentio_create_incident',
  name: 'incident.io Create Incident',
  description: 'Create a new incident in incident.io',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'incident.io API key',
    },
    name: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The name of the incident',
    },
    idempotencyKey: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'A unique key to deduplicate the request',
    },
  },

  request: {
    url: () => 'https://api.incident.io/v2/incidents',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      idempotency_key: params.idempotencyKey || crypto.randomUUID(),
      visibility: 'public',
      name: params.name,
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
    data: { type: 'json', description: 'The created incident object' },
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
