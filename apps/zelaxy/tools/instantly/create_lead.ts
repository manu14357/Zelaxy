import type { CreateLeadParams, InstantlyObjectResponse } from '@/tools/instantly/types'
import type { ToolConfig } from '@/tools/types'

export const createLeadTool: ToolConfig<CreateLeadParams, InstantlyObjectResponse> = {
  id: 'instantly_create_lead',
  name: 'Instantly Create Lead',
  description: 'Create a lead in an Instantly campaign',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Instantly API key',
    },
    campaign: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Campaign ID to add the lead to',
    },
    email: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Lead email address',
    },
  },

  request: {
    url: () => 'https://api.instantly.ai/api/v2/leads',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      campaign: params.campaign,
      email: params.email,
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
    data: { type: 'json', description: 'The created Instantly lead object' },
    metadata: {
      type: 'json',
      description: 'Lead identifiers',
      properties: {
        id: { type: 'string', description: 'Lead ID' },
      },
    },
  },
}
