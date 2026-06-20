import type { ExtendObjectResponse, ExtendParseParams } from '@/tools/extend/types'
import type { ToolConfig } from '@/tools/types'

export const parseTool: ToolConfig<ExtendParseParams, ExtendObjectResponse> = {
  id: 'extend_parse',
  name: 'Extend Parse Document',
  description: 'Parse and extract structured content from a document using the Extend API',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Extend API key',
    },
    fileUrl: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Publicly accessible URL of the document to parse',
    },
    outputFormat: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Target output format: markdown or spatial (default markdown)',
    },
    chunking: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Chunking strategy: page, document, or section',
    },
    engine: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Parsing engine: parse_performance or parse_light',
    },
  },

  request: {
    url: () => 'https://api.extend.ai/parse',
    method: 'POST',
    headers: (params) => ({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
      'x-extend-api-version': '2025-04-21',
    }),
    body: (params) => {
      const config: Record<string, any> = {}
      if (params.outputFormat) config.target = params.outputFormat
      if (params.chunking) config.chunkingStrategy = { type: params.chunking }
      if (params.engine) config.engine = params.engine

      const body: Record<string, any> = { file: { fileUrl: params.fileUrl } }
      if (Object.keys(config).length > 0) body.config = config
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data,
        metadata: { id: data.id ?? null, status: data.status ?? null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The parsed document object from Extend' },
    metadata: {
      type: 'json',
      description: 'Parse run identifiers',
      properties: {
        id: { type: 'string', description: 'Parse run ID' },
        status: { type: 'string', description: 'Processing status' },
      },
    },
  },
}
