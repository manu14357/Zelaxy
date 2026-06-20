import type { FirefliesListResponse, FirefliesListTranscriptsParams } from '@/tools/fireflies/types'
import type { ToolConfig } from '@/tools/types'

export const listTranscriptsTool: ToolConfig<
  FirefliesListTranscriptsParams,
  FirefliesListResponse
> = {
  id: 'fireflies_list_transcripts',
  name: 'Fireflies List Transcripts',
  description: 'List meeting transcripts from Fireflies.ai',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Fireflies API key',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of transcripts to return',
    },
  },

  request: {
    url: () => 'https://api.fireflies.ai/graphql',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      query: `query Transcripts($limit: Int) {
        transcripts(limit: $limit) {
          id
          title
          date
          duration
          host_email
          participants
        }
      }`,
      variables: { limit: params.limit ? Number(params.limit) : 10 },
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const transcripts = data.data?.transcripts || []
    return {
      success: true,
      output: { data: transcripts, metadata: { count: transcripts.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Fireflies transcript objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of transcripts returned' },
      },
    },
  },
}
