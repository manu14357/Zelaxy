import type { ObsidianListFilesParams, ObsidianResponse } from '@/tools/obsidian/types'
import type { ToolConfig } from '@/tools/types'

export const listFilesTool: ToolConfig<ObsidianListFilesParams, ObsidianResponse> = {
  id: 'obsidian_list_files',
  name: 'Obsidian List Files',
  description: 'List files and directories in your Obsidian vault',
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
    path: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Directory path relative to vault root. Leave empty to list the root.',
    },
  },

  request: {
    url: (params) => {
      const base = params.baseUrl.replace(/\/$/, '')
      const path = params.path
        ? `/${params.path.trim().split('/').map(encodeURIComponent).join('/')}/`
        : '/'
      return `${base}/vault${path}`
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      Accept: 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const files = data.files ?? []
    return {
      success: true,
      output: { data: files, metadata: { count: files.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'List of files and directories in the vault' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of entries returned' },
      },
    },
  },
}
