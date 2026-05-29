import type { ToolConfig } from '@/tools/types'

export const quiverTextToSvgTool: ToolConfig = {
  id: 'quiver_text_to_svg',
  name: 'Quiver Text to SVG',
  description: 'Generate SVG images from text prompts using QuiverAI',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'QuiverAI API key',
    },
    prompt: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'A text description of the desired SVG',
    },
    model: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'The model to use for SVG generation (e.g., "arrow-preview")',
    },
    instructions: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Style or formatting guidance for the SVG output',
    },
    references: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Reference images to guide SVG generation (up to 4)',
    },
    n: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of SVGs to generate (1-16, default 1)',
    },
    temperature: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sampling temperature (0-2, default 1)',
    },
    top_p: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Nucleus sampling probability (0-1, default 1)',
    },
    max_output_tokens: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum output tokens (1-131072)',
    },
    presence_penalty: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Token penalty for prior output (-2 to 2, default 0)',
    },
  },

  request: {
    url: '/api/tools/quiver/text-to-svg',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params: any) => ({
      apiKey: params.apiKey,
      prompt: params.prompt,
      model: params.model,
      instructions: params.instructions,
      references: params.references,
      n: params.n,
      temperature: params.temperature,
      top_p: params.top_p,
      max_output_tokens: params.max_output_tokens,
      presence_penalty: params.presence_penalty,
    }),
  },

  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate SVG')
    }
    return data
  },

  outputs: {
    success: { type: 'boolean', description: 'Whether the SVG generation succeeded' },
    output: {
      type: 'json',
      description: 'Generated SVG output',
      properties: {
        file: { type: 'json', description: 'First generated SVG file' },
        files: { type: 'json', description: 'All generated SVG files (when n > 1)' },
        svgContent: { type: 'string', description: 'Raw SVG markup content of the first result' },
        id: { type: 'string', description: 'Generation request ID' },
        usage: {
          type: 'json',
          description: 'Token usage statistics',
          properties: {
            totalTokens: { type: 'number', description: 'Total tokens used' },
            inputTokens: { type: 'number', description: 'Input tokens used' },
            outputTokens: { type: 'number', description: 'Output tokens used' },
          },
        },
      },
    },
  },
}

export const quiverImageToSvgTool: ToolConfig = {
  id: 'quiver_image_to_svg',
  name: 'Quiver Image to SVG',
  description: 'Convert raster images into vector SVG format using QuiverAI',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'QuiverAI API key',
    },
    model: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'The model to use for vectorization (e.g., "arrow-preview")',
    },
    image: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description: 'The raster image to vectorize into SVG',
    },
    temperature: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sampling temperature (0-2, default 1)',
    },
    top_p: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Nucleus sampling probability (0-1, default 1)',
    },
    max_output_tokens: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum output tokens (1-131072)',
    },
    presence_penalty: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Token penalty for prior output (-2 to 2, default 0)',
    },
    auto_crop: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Automatically crop the image before vectorizing',
    },
    target_size: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Square resize target in pixels (128-4096)',
    },
  },

  request: {
    url: '/api/tools/quiver/image-to-svg',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params: any) => ({
      apiKey: params.apiKey,
      model: params.model,
      image: params.image,
      temperature: params.temperature,
      top_p: params.top_p,
      max_output_tokens: params.max_output_tokens,
      presence_penalty: params.presence_penalty,
      auto_crop: params.auto_crop,
      target_size: params.target_size,
    }),
  },

  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Failed to vectorize image')
    }
    return data
  },

  outputs: {
    success: { type: 'boolean', description: 'Whether the vectorization succeeded' },
    output: {
      type: 'json',
      description: 'Vectorized SVG output',
      properties: {
        file: { type: 'json', description: 'Generated SVG file' },
        svgContent: { type: 'string', description: 'Raw SVG markup content' },
        id: { type: 'string', description: 'Vectorization request ID' },
        usage: {
          type: 'json',
          description: 'Token usage statistics',
          properties: {
            totalTokens: { type: 'number', description: 'Total tokens used' },
            inputTokens: { type: 'number', description: 'Input tokens used' },
            outputTokens: { type: 'number', description: 'Output tokens used' },
          },
        },
      },
    },
  },
}

export const quiverListModelsTool: ToolConfig = {
  id: 'quiver_list_models',
  name: 'Quiver List Models',
  description: 'List all available QuiverAI models',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'QuiverAI API key',
    },
  },

  request: {
    url: 'https://api.quiver.ai/v1/models',
    method: 'GET',
    headers: (params: any) => ({
      Authorization: `Bearer ${params.apiKey}`,
    }),
  },

  transformResponse: async (response: Response) => {
    if (!response.ok) {
      let message = `Quiver API error: ${response.status}`
      try {
        const errorData = await response.json()
        message = errorData.message || message
      } catch {
        // Non-JSON error body
      }
      throw new Error(message)
    }

    const data = await response.json()

    const models = (data.data ?? []).map(
      (model: {
        id: string
        name: string
        description: string
        created: number
        owned_by: string
        input_modalities: string[]
        output_modalities: string[]
        context_length: number
        max_output_length: number
        supported_operations: string[]
        supported_sampling_parameters: string[]
      }) => ({
        id: model.id ?? null,
        name: model.name ?? null,
        description: model.description ?? null,
        created: model.created ?? null,
        ownedBy: model.owned_by ?? null,
        inputModalities: model.input_modalities ?? [],
        outputModalities: model.output_modalities ?? [],
        contextLength: model.context_length ?? null,
        maxOutputLength: model.max_output_length ?? null,
        supportedOperations: model.supported_operations ?? [],
        supportedSamplingParameters: model.supported_sampling_parameters ?? [],
      })
    )

    return {
      success: true,
      output: { models },
    }
  },

  outputs: {
    success: { type: 'boolean', description: 'Whether the request succeeded' },
    output: {
      type: 'json',
      description: 'Available models',
      properties: {
        models: {
          type: 'json',
          description: 'List of available QuiverAI models',
        },
      },
    },
  },
}
