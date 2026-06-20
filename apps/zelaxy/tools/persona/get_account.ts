import type { PersonaGetAccountParams, PersonaObjectResponse } from '@/tools/persona/types'
import type { ToolConfig } from '@/tools/types'

export const getAccountTool: ToolConfig<PersonaGetAccountParams, PersonaObjectResponse> = {
  id: 'persona_get_account',
  name: 'Persona Get Account',
  description: 'Retrieve a single Persona account by ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Persona API key',
    },
    id: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Account ID to retrieve (starts with act_)',
    },
  },

  request: {
    url: (params) => `https://api.withpersona.com/api/v1/accounts/${encodeURIComponent(params.id)}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Persona-Version': '2023-01-05',
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const account = data.data ?? data
    return {
      success: true,
      output: { data: account, metadata: { id: account?.id, type: account?.type } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The retrieved Persona account object' },
    metadata: {
      type: 'json',
      description: 'Account identifiers',
      properties: {
        id: { type: 'string', description: 'Account ID' },
        type: { type: 'string', description: 'Resource type' },
      },
    },
  },
}
