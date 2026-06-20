import type { LemlistAddLeadParams, LemlistObjectResponse } from '@/tools/lemlist/types'
import type { ToolConfig } from '@/tools/types'

export const addLeadTool: ToolConfig<LemlistAddLeadParams, LemlistObjectResponse> = {
  id: 'lemlist_add_lead',
  name: 'Lemlist Add Lead',
  description: 'Add a lead to a Lemlist campaign',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Lemlist API key',
    },
    campaignId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the campaign to add the lead to',
    },
    email: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The email address of the lead',
    },
    firstName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'The lead first name',
    },
    lastName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'The lead last name',
    },
  },

  request: {
    url: (params) =>
      `https://api.lemlist.com/api/campaigns/${params.campaignId}/leads/${encodeURIComponent(params.email)}`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`:${params.apiKey}`).toString('base64')}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = {}
      if (params.firstName) body.firstName = params.firstName
      if (params.lastName) body.lastName = params.lastName
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data._id || data.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The created Lemlist lead object' },
    metadata: {
      type: 'json',
      description: 'Lead identifiers',
      properties: {
        id: { type: 'string', description: 'Lead ID' },
      },
    },
  },
}
