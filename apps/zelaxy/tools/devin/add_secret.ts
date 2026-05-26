import type { ToolConfig } from '@/tools/types'
import type { DevinAddSecretParams, DevinAddSecretResponse } from './types'

export const devinAddSecretTool: ToolConfig<DevinAddSecretParams, DevinAddSecretResponse> = {
  id: 'devin_add_secret',
  name: 'Add Secret',
  description: 'Add or update a secret in the Devin organization secrets store.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Devin API key (service user credential starting with cog_)',
    },
    secretName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The name of the secret (e.g., API_KEY)',
    },
    secretValue: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'The value of the secret',
    },
  },

  request: {
    url: 'https://api.devin.ai/v3/organizations/secrets',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      name: params.secretName,
      value: params.secretValue,
    }),
  },

  transformResponse: async (response: Response, params) => {
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || `Failed to add secret: ${response.statusText}`)
    }
    return {
      success: true,
      output: {
        success: true,
        secretName: params?.secretName ?? null,
      },
    }
  },

  outputs: {
    success: { type: 'boolean', description: 'Whether the secret was added successfully' },
    secretName: {
      type: 'string',
      description: 'Name of the secret that was added',
      optional: true,
    },
  },
}
