import type { ToolConfig } from '@/tools/types'
import type { WizaObjectResponse, WizaRevealIndividualParams } from '@/tools/wiza/types'

export const revealIndividualTool: ToolConfig<WizaRevealIndividualParams, WizaObjectResponse> = {
  id: 'wiza_reveal_individual',
  name: 'Wiza Reveal Individual',
  description: 'Reveal contact details for an individual from a LinkedIn URL',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Wiza API key',
    },
    linkedin_url: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'LinkedIn profile URL to reveal contact details for',
    },
  },

  request: {
    url: () => 'https://wiza.co/api/individual_reveals',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      individual: { linkedin_url: params.linkedin_url },
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const reveal = data.data ?? data
    return {
      success: true,
      output: { data: reveal, metadata: { id: reveal?.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The individual reveal object' },
    metadata: {
      type: 'json',
      description: 'Reveal identifiers',
      properties: {
        id: { type: 'string', description: 'Reveal ID' },
      },
    },
  },
}
