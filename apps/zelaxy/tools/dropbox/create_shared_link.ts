import type { ToolConfig } from '@/tools/types'

export const dropboxCreateSharedLinkTool: ToolConfig = {
  id: 'dropbox_create_shared_link',
  name: 'Dropbox Create Shared Link',
  description: 'Create a shared link for a Dropbox file or folder.',
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
      description: 'Path of the file or folder to share',
    },
  },

  request: {
    url: 'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({ path: params.path, settings: {} }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(
        (data as { error_summary?: string }).error_summary || `HTTP ${response.status}`
      )
    }
    return {
      success: true,
      output: {
        url: data.url ?? '',
        path: data.path_lower ?? '',
        name: data.name ?? '',
      },
    }
  },

  outputs: {
    url: { type: 'string', description: 'Shared link URL' },
    path: { type: 'string', description: 'File path' },
    name: { type: 'string', description: 'File name' },
  },
}
