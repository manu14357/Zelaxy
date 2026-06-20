import type { CreatePersonParams, PipedriveObjectResponse } from '@/tools/pipedrive/types'
import type { ToolConfig } from '@/tools/types'

export const createPersonTool: ToolConfig<CreatePersonParams, PipedriveObjectResponse> = {
  id: 'pipedrive_create_person',
  name: 'Pipedrive Create Person',
  description: 'Create a new person (contact) in Pipedrive',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Pipedrive API token',
    },
    name: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The name of the person',
    },
    email: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Email address of the person',
    },
    phone: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Phone number of the person',
    },
    org_id: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'ID of the organization this person belongs to',
    },
  },

  request: {
    url: (params) =>
      `https://api.pipedrive.com/v1/persons?api_token=${encodeURIComponent(params.apiKey)}`,
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = { name: params.name }
      if (params.email) body.email = params.email
      if (params.phone) body.phone = params.phone
      if (params.org_id !== undefined) body.org_id = params.org_id
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data: data.data ?? {}, metadata: { id: data.data?.id ?? null } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The created Pipedrive person object' },
    metadata: {
      type: 'json',
      description: 'Person identifiers',
      properties: {
        id: { type: 'number', description: 'Person ID' },
      },
    },
  },
}
