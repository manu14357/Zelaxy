import type { CreateDealParams, PipedriveObjectResponse } from '@/tools/pipedrive/types'
import type { ToolConfig } from '@/tools/types'

export const createDealTool: ToolConfig<CreateDealParams, PipedriveObjectResponse> = {
  id: 'pipedrive_create_deal',
  name: 'Pipedrive Create Deal',
  description: 'Create a new deal in Pipedrive',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Pipedrive API token',
    },
    title: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The title of the deal',
    },
    value: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'The monetary value of the deal',
    },
    currency: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Currency code (e.g. USD, EUR, GBP)',
    },
    person_id: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'ID of the person this deal is associated with',
    },
    org_id: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'ID of the organization this deal is associated with',
    },
    stage_id: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'ID of the stage this deal should be placed in',
    },
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Status of the deal: open, won, lost',
    },
  },

  request: {
    url: (params) =>
      `https://api.pipedrive.com/v1/deals?api_token=${encodeURIComponent(params.apiKey)}`,
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = { title: params.title }
      if (params.value !== undefined) body.value = params.value
      if (params.currency) body.currency = params.currency
      if (params.person_id !== undefined) body.person_id = params.person_id
      if (params.org_id !== undefined) body.org_id = params.org_id
      if (params.stage_id !== undefined) body.stage_id = params.stage_id
      if (params.status) body.status = params.status
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
    data: { type: 'json', description: 'The created Pipedrive deal object' },
    metadata: {
      type: 'json',
      description: 'Deal identifiers',
      properties: {
        id: { type: 'number', description: 'Deal ID' },
      },
    },
  },
}
