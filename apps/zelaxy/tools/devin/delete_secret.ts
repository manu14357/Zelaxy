import type { ToolConfig } from '@/tools/types'
import type { DevinDeleteSecretParams, DevinDeleteSecretResponse } from './types'

export const devinDeleteSecretTool: ToolConfig<DevinDeleteSecretParams, DevinDeleteSecretResponse> =
  {
    id: 'devin_delete_secret',
    name: 'Delete Secret',
    description: 'Delete a secret from the Devin organization secrets store.',
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
        description: 'The name of the secret to delete',
      },
    },

    request: {
      url: (params) =>
        `https://api.devin.ai/v3/organizations/secrets/${encodeURIComponent(params.secretName)}`,
      method: 'DELETE',
      headers: (params) => ({
        Authorization: `Bearer ${params.apiKey}`,
      }),
    },

    transformResponse: async (response: Response, params) => {
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `Failed to delete secret: ${response.statusText}`)
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
      success: { type: 'boolean', description: 'Whether the secret was deleted successfully' },
      secretName: {
        type: 'string',
        description: 'Name of the secret that was deleted',
        optional: true,
      },
    },
  }
