import type { ToolConfig } from '@/tools/types'

export const gammaGenerateTool: ToolConfig = {
  id: 'gamma_generate',
  name: 'Gamma Generate',
  description:
    'Generate a new Gamma presentation, document, webpage, or social post from text input.',
  version: '1.0.0',
  params: {
    apiKey: { type: 'string', required: true, visibility: 'user-only', description: 'Gamma API key' },
    inputText: { type: 'string', required: true, visibility: 'user-or-llm', description: 'Text used to generate your gamma (1-100,000 tokens)' },
    textMode: { type: 'string', required: true, visibility: 'user-or-llm', description: 'How to handle input text: generate, condense, or preserve' },
    format: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Output format: presentation, document, webpage, or social' },
    themeId: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Custom Gamma workspace theme ID' },
    numCards: { type: 'number', required: false, visibility: 'user-or-llm', description: 'Number of cards/slides to generate (1-75)' },
    cardSplit: { type: 'string', required: false, visibility: 'user-or-llm', description: 'How to split content: auto or inputTextBreaks' },
    cardDimensions: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Card aspect ratio (e.g., fluid, 16x9)' },
    additionalInstructions: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Additional instructions for AI generation (max 2000 chars)' },
    exportAs: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Export as pdf or pptx' },
    folderIds: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Comma-separated folder IDs to store the gamma in' },
    textAmount: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Amount of text per card: brief, medium, detailed, or extensive' },
    textTone: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Tone of the generated text' },
    textAudience: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Target audience for the generated text' },
    textLanguage: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Language code (default: en)' },
    imageSource: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Image source: aiGenerated, pictographic, unsplash, placeholder, noImages, etc.' },
    imageModel: { type: 'string', required: false, visibility: 'user-or-llm', description: 'AI image generation model' },
    imageStyle: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Style directive for AI-generated images' },
  },
  request: {
    url: 'https://public-api.gamma.app/v1.0/generations',
    method: 'POST',
    headers: (params: any) => ({ 'Content-Type': 'application/json', 'X-API-KEY': params.apiKey }),
    body: (params: any) => {
      const body: Record<string, unknown> = { inputText: params.inputText, textMode: params.textMode }
      if (params.format) body.format = params.format
      if (params.themeId) body.themeId = params.themeId
      if (params.numCards) body.numCards = params.numCards
      if (params.cardSplit) body.cardSplit = params.cardSplit
      if (params.additionalInstructions) body.additionalInstructions = params.additionalInstructions
      if (params.exportAs) body.exportAs = params.exportAs
      if (params.folderIds) body.folderIds = params.folderIds.split(',').map((id: string) => id.trim())
      const textOptions: Record<string, unknown> = {}
      if (params.textAmount) textOptions.amount = params.textAmount
      if (params.textTone) textOptions.tone = params.textTone
      if (params.textAudience) textOptions.audience = params.textAudience
      if (params.textLanguage) textOptions.language = params.textLanguage
      if (Object.keys(textOptions).length) body.textOptions = textOptions
      const imageOptions: Record<string, unknown> = {}
      if (params.imageSource) imageOptions.source = params.imageSource
      if (params.imageModel) imageOptions.model = params.imageModel
      if (params.imageStyle) imageOptions.style = params.imageStyle
      if (Object.keys(imageOptions).length) body.imageOptions = imageOptions
      if (params.cardDimensions) body.cardOptions = { dimensions: params.cardDimensions }
      return body
    },
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    return { success: true, output: { generationId: data.generationId ?? '' } }
  },
  outputs: {
    generationId: { type: 'string', description: 'The ID of the generation job. Use with Check Status to poll for completion.' },
  },
}

export const gammaGenerateFromTemplateTool: ToolConfig = {
  id: 'gamma_generate_from_template',
  name: 'Gamma Generate from Template',
  description: 'Generate a new Gamma by adapting an existing template with a prompt.',
  version: '1.0.0',
  params: {
    apiKey: { type: 'string', required: true, visibility: 'user-only', description: 'Gamma API key' },
    gammaId: { type: 'string', required: true, visibility: 'user-or-llm', description: 'The ID of the template gamma to adapt' },
    prompt: { type: 'string', required: true, visibility: 'user-or-llm', description: 'Instructions for how to adapt the template' },
    themeId: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Custom Gamma workspace theme ID to apply' },
    exportAs: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Export as pdf or pptx' },
    folderIds: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Comma-separated folder IDs' },
    imageModel: { type: 'string', required: false, visibility: 'user-or-llm', description: 'AI image generation model' },
    imageStyle: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Style directive for AI-generated images' },
  },
  request: {
    url: 'https://public-api.gamma.app/v1.0/generations/from-template',
    method: 'POST',
    headers: (params: any) => ({ 'Content-Type': 'application/json', 'X-API-KEY': params.apiKey }),
    body: (params: any) => {
      const body: Record<string, unknown> = { gammaId: params.gammaId, prompt: params.prompt }
      if (params.themeId) body.themeId = params.themeId
      if (params.exportAs) body.exportAs = params.exportAs
      if (params.folderIds) body.folderIds = params.folderIds.split(',').map((id: string) => id.trim())
      const imageOptions: Record<string, unknown> = {}
      if (params.imageModel) imageOptions.model = params.imageModel
      if (params.imageStyle) imageOptions.style = params.imageStyle
      if (Object.keys(imageOptions).length) body.imageOptions = imageOptions
      return body
    },
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    return { success: true, output: { generationId: data.generationId ?? '' } }
  },
  outputs: {
    generationId: { type: 'string', description: 'The ID of the generation job.' },
  },
}

export const gammaCheckStatusTool: ToolConfig = {
  id: 'gamma_check_status',
  name: 'Gamma Check Status',
  description: 'Check the status of a Gamma generation job. Returns the gamma URL when completed.',
  version: '1.0.0',
  params: {
    apiKey: { type: 'string', required: true, visibility: 'user-only', description: 'Gamma API key' },
    generationId: { type: 'string', required: true, visibility: 'user-or-llm', description: 'The generation ID returned by the Generate tool' },
  },
  request: {
    url: (params: any) => `https://public-api.gamma.app/v1.0/generations/${params.generationId}`,
    method: 'GET',
    headers: (params: any) => ({ 'X-API-KEY': params.apiKey }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    const output: Record<string, any> = {
      generationId: data.generationId ?? '',
      status: data.status ?? 'pending',
      gammaUrl: data.gammaUrl ?? null,
    }
    if (data.credits) output.credits = { deducted: data.credits.deducted ?? null, remaining: data.credits.remaining ?? null }
    if (data.error) output.error = { message: data.error.message ?? null, statusCode: data.error.statusCode ?? null }
    return { success: true, output }
  },
  outputs: {
    generationId: { type: 'string', description: 'The generation ID' },
    status: { type: 'string', description: 'Generation status: pending, completed, or failed' },
    gammaUrl: { type: 'string', description: 'URL of the generated gamma (when completed)', optional: true },
    credits: { type: 'json', description: 'Credit usage information', optional: true },
    error: { type: 'json', description: 'Error details (when failed)', optional: true },
  },
}

export const gammaListThemesTool: ToolConfig = {
  id: 'gamma_list_themes',
  name: 'Gamma List Themes',
  description: 'List available themes in your Gamma workspace.',
  version: '1.0.0',
  params: {
    apiKey: { type: 'string', required: true, visibility: 'user-only', description: 'Gamma API key' },
    query: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Search query to filter themes by name' },
    limit: { type: 'number', required: false, visibility: 'user-or-llm', description: 'Max number of themes per page (max 50)' },
    after: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Pagination cursor from previous response' },
  },
  request: {
    url: (params: any) => {
      const url = new URL('https://public-api.gamma.app/v1.0/themes')
      if (params.query) url.searchParams.append('query', params.query)
      if (params.limit) url.searchParams.append('limit', String(params.limit))
      if (params.after) url.searchParams.append('after', params.after)
      return url.toString()
    },
    method: 'GET',
    headers: (params: any) => ({ 'X-API-KEY': params.apiKey }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    const items = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
    return {
      success: true,
      output: {
        themes: items.map((t: any) => ({ id: t.id ?? '', name: t.name ?? '', type: t.type ?? '', colorKeywords: t.colorKeywords ?? [], toneKeywords: t.toneKeywords ?? [] })),
        hasMore: data.hasMore ?? false,
        nextCursor: data.nextCursor ?? null,
      },
    }
  },
  outputs: {
    themes: { type: 'array', description: 'List of available themes' },
    hasMore: { type: 'boolean', description: 'Whether more results are available' },
    nextCursor: { type: 'string', description: 'Pagination cursor', optional: true },
  },
}

export const gammaListFoldersTool: ToolConfig = {
  id: 'gamma_list_folders',
  name: 'Gamma List Folders',
  description: 'List available folders in your Gamma workspace.',
  version: '1.0.0',
  params: {
    apiKey: { type: 'string', required: true, visibility: 'user-only', description: 'Gamma API key' },
    query: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Search query to filter folders by name' },
    limit: { type: 'number', required: false, visibility: 'user-or-llm', description: 'Max number of folders per page (max 50)' },
    after: { type: 'string', required: false, visibility: 'user-or-llm', description: 'Pagination cursor from previous response' },
  },
  request: {
    url: (params: any) => {
      const url = new URL('https://public-api.gamma.app/v1.0/folders')
      if (params.query) url.searchParams.append('query', params.query)
      if (params.limit) url.searchParams.append('limit', String(params.limit))
      if (params.after) url.searchParams.append('after', params.after)
      return url.toString()
    },
    method: 'GET',
    headers: (params: any) => ({ 'X-API-KEY': params.apiKey }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    const items = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
    return {
      success: true,
      output: {
        folders: items.map((f: any) => ({ id: f.id ?? '', name: f.name ?? '' })),
        hasMore: data.hasMore ?? false,
        nextCursor: data.nextCursor ?? null,
      },
    }
  },
  outputs: {
    folders: { type: 'array', description: 'List of available folders' },
    hasMore: { type: 'boolean', description: 'Whether more results are available' },
    nextCursor: { type: 'string', description: 'Pagination cursor', optional: true },
  },
}
