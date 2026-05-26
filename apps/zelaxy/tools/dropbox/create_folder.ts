import type { ToolConfig } from '@/tools/types'

export const dropboxCreateFolderTool: ToolConfig = {
  id: 'dropbox_create_folder',
  name: 'Dropbox Create Folder',
  description: 'Create a new folder in Dropbox.',
  version: '1.0.0',

  oauth: {
    required: true,
    provider: 'dropbox',
  },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'Dropbox OAuth access token',
    },
    path: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Path for the new folder (e.g., /my-folder)',
    },
  },

  request: {
    url: 'https://api.dropboxapi.com/2/files/create_folder_v2',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({ path: params.path, autorename: false }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(
        (data as { error_summary?: string }).error_summary || `HTTP ${response.status}`
      )
    }
    const meta = (data.metadata ?? data) as Record<string, unknown>
    return {
      success: true,
      output: {
        id: meta.id ?? '',
        path: meta.path_display ?? meta.path_lower ?? '',
        name: meta.name ?? '',
      },
    }
  },

  outputs: {
    id: { type: 'string', description: 'Folder ID' },
    path: { type: 'string', description: 'Folder path' },
    name: { type: 'string', description: 'Folder name' },
  },
}
