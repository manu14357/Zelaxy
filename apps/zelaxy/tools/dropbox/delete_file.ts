import type { ToolConfig } from '@/tools/types'

export const dropboxDeleteFileTool: ToolConfig = {
  id: 'dropbox_delete_file',
  name: 'Dropbox Delete File',
  description: 'Delete a file or folder from Dropbox.',
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
      description: 'Path of the file or folder to delete',
    },
  },

  request: {
    url: 'https://api.dropboxapi.com/2/files/delete_v2',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({ path: params.path }),
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
        path: meta.path_display ?? meta.path_lower ?? '',
        name: meta.name ?? '',
      },
    }
  },

  outputs: {
    path: { type: 'string', description: 'Path of the deleted item' },
    name: { type: 'string', description: 'Name of the deleted item' },
  },
}
