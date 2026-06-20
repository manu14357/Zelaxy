import type { CreateFeedbackParams, LangSmithObjectResponse } from '@/tools/langsmith/types'
import type { ToolConfig } from '@/tools/types'

export const createFeedbackTool: ToolConfig<CreateFeedbackParams, LangSmithObjectResponse> = {
  id: 'langsmith_create_feedback',
  name: 'LangSmith Create Feedback',
  description: 'Create feedback for a LangSmith run',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'LangSmith API key',
    },
    run_id: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the run to attach feedback to',
    },
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Feedback key (e.g. correctness)',
    },
    score: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Numeric feedback score',
    },
  },

  request: {
    url: () => 'https://api.smith.langchain.com/feedback',
    method: 'POST',
    headers: (params) => ({
      'x-api-key': params.apiKey,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = { run_id: params.run_id, key: params.key }
      if (params.score !== undefined) body.score = params.score
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data?.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The created feedback object' },
    metadata: {
      type: 'json',
      description: 'Feedback identifiers',
      properties: {
        id: { type: 'string', description: 'Feedback ID' },
      },
    },
  },
}
