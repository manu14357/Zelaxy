import type { DSPyRunParams, DSPyRunResponse } from '@/tools/dspy/types'
import type { ToolConfig } from '@/tools/types'

export const dspyRunTool: ToolConfig<DSPyRunParams, DSPyRunResponse> = {
  id: 'dspy_run',
  name: 'DSPy Run',
  description: 'Run a DSPy program and get its output',
  version: '1.0.0',

  params: {
    baseUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Base URL of the DSPy server (e.g., https://your-dspy-server.com)',
    },
    apiKey: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'API key for authentication (if required by your server)',
    },
    program: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'DSPy program code to execute',
    },
    input: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Input to pass to the DSPy program',
    },
  },

  request: {
    method: 'POST',
    url: (params) => {
      const baseUrl = params.baseUrl.replace(/\/$/, '')
      return `${baseUrl}/run`
    },
    headers: (params) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (params.apiKey) {
        headers.Authorization = `Bearer ${params.apiKey}`
      }
      return headers
    },
    body: (params) => ({
      program: params.program,
      input: params.input,
    }),
  },

  transformResponse: async (response: Response) => {
    const data = await response.json()
    const outputData = data.data ?? data

    return {
      success: true,
      output: {
        output: outputData.output ?? outputData.answer ?? outputData.response ?? '',
        prediction: outputData.prediction ?? outputData ?? {},
      },
    }
  },

  outputs: {
    output: {
      type: 'string',
      description: 'Program output',
    },
    prediction: {
      type: 'json',
      description: 'Prediction object',
    },
  },
}
