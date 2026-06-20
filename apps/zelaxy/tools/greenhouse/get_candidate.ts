import type { GetCandidateParams, GreenhouseObjectResponse } from '@/tools/greenhouse/types'
import type { ToolConfig } from '@/tools/types'

export const getCandidateTool: ToolConfig<GetCandidateParams, GreenhouseObjectResponse> = {
  id: 'greenhouse_get_candidate',
  name: 'Greenhouse Get Candidate',
  description: 'Get a single candidate from Greenhouse by ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Greenhouse Harvest API key',
    },
    id: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The candidate ID',
    },
  },

  request: {
    url: (params) => `https://harvest.greenhouse.io/v1/candidates/${encodeURIComponent(params.id)}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`${params.apiKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: String(data.id) } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Greenhouse candidate object' },
    metadata: {
      type: 'json',
      description: 'Candidate identifiers',
      properties: {
        id: { type: 'string', description: 'Candidate ID' },
      },
    },
  },
}
