import type { ToolConfig } from '@/tools/types'

export const agentphoneReleaseNumberTool: ToolConfig = {
  id: 'agentphone_release_number',
  name: 'Release Phone Number',
  description: 'Release (delete) a phone number. This action is irreversible.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'AgentPhone API key',
    },
    numberId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the phone number to release',
    },
  },

  request: {
    url: (params) => `https://api.agentphone.to/v1/numbers/${params.numberId.trim()}`,
    method: 'DELETE',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
    }),
  },

  transformResponse: async (response, params) => {
    const numberId = params?.numberId?.trim() ?? ''
    if (!response.ok) {
      let errorMessage = 'Failed to release phone number'
      try {
        const data = await response.json()
        errorMessage = data?.detail?.[0]?.msg ?? data?.message ?? errorMessage
      } catch {
        // ignore
      }
      throw new Error(errorMessage)
    }
    return {
      success: true,
      output: { id: numberId, released: true },
    }
  },

  outputs: {
    id: { type: 'string', description: 'ID of the released phone number' },
    released: { type: 'boolean', description: 'Whether the number was released successfully' },
  },
}
