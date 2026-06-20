import type { ParseParams, ReductoResponse } from '@/tools/reducto/types'
import type { ToolConfig } from '@/tools/types'

export const parseTool: ToolConfig<ParseParams, ReductoResponse> = {
  id: 'reducto_parse',
  name: 'Reducto Parse',
  description: 'Parse a document into structured content with Reducto (POST /parse).',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Reducto API key',
    },
    documentUrl: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Publicly accessible URL of the document to parse',
    },
  },

  request: {
    url: 'https://platform.reducto.ai/parse',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: (params) => ({
      input: params.documentUrl,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { jobId: data?.job_id, status: response.status } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Parsed document content (chunks, blocks, usage)' },
    metadata: {
      type: 'json',
      description: 'Job metadata',
      properties: {
        jobId: { type: 'string', description: 'Reducto job identifier' },
        status: { type: 'number', description: 'HTTP status code returned by Reducto' },
      },
    },
  },
}
