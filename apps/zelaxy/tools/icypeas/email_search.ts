import type { EmailSearchParams, IcypeasObjectResponse } from '@/tools/icypeas/types'
import type { ToolConfig } from '@/tools/types'

export const emailSearchTool: ToolConfig<EmailSearchParams, IcypeasObjectResponse> = {
  id: 'icypeas_email_search',
  name: 'Icypeas Email Search',
  description: 'Find a professional email from a first name, last name, and company',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Icypeas API key',
    },
    firstname: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: "Target person's first name",
    },
    lastname: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: "Target person's last name",
    },
    domainOrCompany: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Company domain (e.g. stripe.com) or company name (e.g. Stripe)',
    },
  },

  request: {
    url: () => 'https://app.icypeas.com/api/email-search',
    method: 'POST',
    headers: (params) => ({
      Authorization: params.apiKey,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      firstname: params.firstname,
      lastname: params.lastname,
      domainOrCompany: params.domainOrCompany,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data,
        metadata: { searchId: data.item?._id ?? null, status: data.item?.status ?? null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The email-search submission response' },
    metadata: {
      type: 'json',
      description: 'Search identifiers',
      properties: {
        searchId: { type: 'string', description: 'Icypeas internal search ID' },
        status: { type: 'string', description: 'Search status' },
      },
    },
  },
}
