import type { ObsidianGetFileParams, ObsidianResponse } from '@/tools/obsidian/types'
import type { ToolConfig } from '@/tools/types'

export const getFileTool: ToolConfig<ObsidianGetFileParams, ObsidianResponse> = {
  id: 'obsidian_get_file',
  name: 'Obsidian Get File',
  description: 'Retrieve the content of a file from your Obsidian vault',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'API key from the Obsidian Local REST API plugin settings',
    },
    baseUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Base URL for the Obsidian Local REST API (e.g. https://127.0.0.1:27124)',
    },
    filename: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Path to the file relative to vault root (e.g. "folder/note.md")',
    },
  },

  request: {
    url: (params) => {
      const base = params.baseUrl.replace(/\/$/, '')
      return `${base}/vault/${params.filename.trim().split('/').map(encodeURIComponent).join('/')}`
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      Accept: 'text/markdown',
    }),
  },

  transformResponse: async (response, params) => {
    const content = await response.text()
    return {
      success: true,
      output: { data: content, metadata: { filename: params?.filename ?? '' } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Markdown content of the file' },
    metadata: {
      type: 'json',
      description: 'File metadata',
      properties: {
        filename: { type: 'string', description: 'Path to the file' },
      },
    },
  },
}
