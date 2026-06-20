import type { ReductoResponse, SplitParams } from '@/tools/reducto/types'
import type { ToolConfig } from '@/tools/types'

export const splitTool: ToolConfig<SplitParams, ReductoResponse> = {
  id: 'reducto_split',
  name: 'Reducto Split',
  description:
    'Split a document into sections based on described categories with Reducto (POST /split).',
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
      description: 'Publicly accessible URL of the document to split',
    },
    splitDescription: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description:
        'Array of category objects defining the sections to split into, e.g. [{"name":"invoice","description":"..."}]',
    },
  },

  request: {
    url: 'https://platform.reducto.ai/split',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: (params) => ({
      input: params.documentUrl,
      split_description: params.splitDescription,
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
    data: { type: 'json', description: 'Split result with detected sections and page ranges' },
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
