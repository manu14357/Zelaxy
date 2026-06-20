import type { DropcontactEnrichResponse, EnrichParams } from '@/tools/dropcontact/types'
import type { ToolConfig } from '@/tools/types'

export const enrichTool: ToolConfig<EnrichParams, DropcontactEnrichResponse> = {
  id: 'dropcontact_enrich',
  name: 'Dropcontact Enrich',
  description: 'Submit a contact for B2B enrichment (returns a request_id to poll)',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Dropcontact API access token',
    },
    email: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Email address of the contact to enrich',
    },
    first_name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'First name of the contact',
    },
    last_name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Last name of the contact',
    },
    company: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Company name of the contact',
    },
    siret: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Include French SIREN/SIRET enrichment',
    },
  },

  request: {
    url: () => 'https://api.dropcontact.com/batch',
    method: 'POST',
    headers: (params) => ({
      'X-Access-Token': params.apiKey,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const contact: Record<string, any> = {}
      if (params.email) contact.email = params.email
      if (params.first_name) contact.first_name = params.first_name
      if (params.last_name) contact.last_name = params.last_name
      if (params.company) contact.company = params.company
      return { data: [contact], siret: params.siret ?? false }
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data,
        metadata: { request_id: data.request_id, success: data.success ?? false },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The enrichment submission response' },
    metadata: {
      type: 'json',
      description: 'Submission identifiers',
      properties: {
        request_id: { type: 'string', description: 'Request ID to poll for results' },
        success: { type: 'boolean', description: 'Whether the submission was accepted' },
      },
    },
  },
}
