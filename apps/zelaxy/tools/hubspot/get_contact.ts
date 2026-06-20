import type { GetContactParams, HubspotObjectResponse } from '@/tools/hubspot/types'
import type { ToolConfig } from '@/tools/types'

export const getContactTool: ToolConfig<GetContactParams, HubspotObjectResponse> = {
  id: 'hubspot_get_contact',
  name: 'HubSpot Get Contact',
  description: 'Retrieve a single contact by ID from HubSpot CRM',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'HubSpot private app access token',
    },
    contactId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The HubSpot contact ID to retrieve',
    },
    properties: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Comma-separated list of property names to return (e.g. "email,firstname,lastname,phone")',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(
        `https://api.hubapi.com/crm/v3/objects/contacts/${params.contactId.trim()}`
      )
      if (params.properties) url.searchParams.append('properties', params.properties)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The retrieved HubSpot contact object' },
    metadata: {
      type: 'json',
      description: 'Contact identifiers',
      properties: {
        id: { type: 'string', description: 'Contact ID' },
      },
    },
  },
}
