import type { CreateContactParams, HubspotObjectResponse } from '@/tools/hubspot/types'
import type { ToolConfig } from '@/tools/types'

export const createContactTool: ToolConfig<CreateContactParams, HubspotObjectResponse> = {
  id: 'hubspot_create_contact',
  name: 'HubSpot Create Contact',
  description: 'Create a new contact in HubSpot CRM',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'HubSpot private app access token',
    },
    properties: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description:
        'Contact properties as a JSON object (e.g. {"email":"john@example.com","firstname":"John","lastname":"Doe"})',
    },
  },

  request: {
    url: () => 'https://api.hubapi.com/crm/v3/objects/contacts',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      let properties = params.properties
      if (typeof properties === 'string') properties = JSON.parse(properties)
      return { properties }
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The created HubSpot contact object' },
    metadata: {
      type: 'json',
      description: 'Contact identifiers',
      properties: {
        id: { type: 'string', description: 'Contact ID' },
      },
    },
  },
}
