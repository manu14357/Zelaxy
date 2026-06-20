import type { FirefliesGetTranscriptParams, FirefliesObjectResponse } from '@/tools/fireflies/types'
import type { ToolConfig } from '@/tools/types'

export const getTranscriptTool: ToolConfig<FirefliesGetTranscriptParams, FirefliesObjectResponse> =
  {
    id: 'fireflies_get_transcript',
    name: 'Fireflies Get Transcript',
    description: 'Get a single transcript with details from Fireflies.ai',
    version: '1.0.0',

    params: {
      apiKey: {
        type: 'string',
        required: true,
        visibility: 'user-only',
        description: 'Fireflies API key',
      },
      transcriptId: {
        type: 'string',
        required: true,
        visibility: 'user-or-llm',
        description: 'The transcript ID to retrieve',
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
        query: `query Transcript($id: String!) {
        transcript(id: $id) {
          id
          title
          date
          duration
          host_email
          participants
          transcript_url
          summary {
            overview
            action_items
            keywords
          }
        }
      }`,
        variables: { id: params.transcriptId },
      }),
    },

    transformResponse: async (response) => {
      const data = await response.json()
      const transcript = data.data?.transcript || {}
      return {
        success: true,
        output: { data: transcript, metadata: { id: transcript.id } },
      }
    },

    outputs: {
      data: { type: 'json', description: 'The Fireflies transcript object' },
      metadata: {
        type: 'json',
        description: 'Transcript identifiers',
        properties: {
          id: { type: 'string', description: 'Transcript ID' },
        },
      },
    },
  }
