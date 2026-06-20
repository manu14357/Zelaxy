import type { ExtractParams, ReductoResponse } from '@/tools/reducto/types'
import type { ToolConfig } from '@/tools/types'

export const extractTool: ToolConfig<ExtractParams, ReductoResponse> = {
  id: 'reducto_extract',
  name: 'Reducto Extract',
  description:
    'Extract structured data from a document against a JSON schema with Reducto (POST /extract).',
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
      description: 'Publicly accessible URL of the document to extract from',
    },
    schema: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description: 'JSON schema describing the fields to extract',
    },
    systemPrompt: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optional system prompt guiding the extraction',
    },
  },

  request: {
    url: 'https://platform.reducto.ai/extract',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: (params) => {
      const instructions: Record<string, any> = { schema: params.schema }
      if (params.systemPrompt) instructions.system_prompt = params.systemPrompt
      return {
        input: params.documentUrl,
        instructions,
      }
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { jobId: data?.job_id, status: response.status } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Extracted structured data and citations' },
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
