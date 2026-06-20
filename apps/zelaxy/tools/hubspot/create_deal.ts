import type { CreateDealParams, HubspotObjectResponse } from '@/tools/hubspot/types'
import type { ToolConfig } from '@/tools/types'

export const createDealTool: ToolConfig<CreateDealParams, HubspotObjectResponse> = {
  id: 'hubspot_create_deal',
  name: 'HubSpot Create Deal',
  description: 'Create a new deal in HubSpot CRM',
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
        'Deal properties as a JSON object (e.g. {"dealname":"New Deal","amount":"5000","dealstage":"appointmentscheduled"})',
    },
  },

  request: {
    url: () => 'https://api.hubapi.com/crm/v3/objects/deals',
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
    data: { type: 'json', description: 'The created HubSpot deal object' },
    metadata: {
      type: 'json',
      description: 'Deal identifiers',
      properties: {
        id: { type: 'string', description: 'Deal ID' },
      },
    },
  },
}
