import type { ToolConfig } from '@/tools/types'

export const dropboxGetFileMetadataTool: ToolConfig = {
  id: 'dropbox_get_file_metadata',
  name: 'Dropbox Get File Metadata',
  description: 'Get metadata for a file or folder in Dropbox.',
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
      description: 'Path of the file or folder',
    },
  },

  request: {
    url: 'https://api.dropboxapi.com/2/files/get_metadata',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({ path: params.path, include_media_info: false }),
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
        id: data.id ?? '',
        path: data.path_display ?? data.path_lower ?? '',
        name: data.name ?? '',
        size: data.size ?? null,
        modified: data.client_modified ?? data.server_modified ?? null,
        isFolder: data['.tag'] === 'folder',
      },
    }
  },

  outputs: {
    id: { type: 'string', description: 'File or folder ID' },
    path: { type: 'string', description: 'Path in Dropbox' },
    name: { type: 'string', description: 'File or folder name' },
    size: { type: 'number', description: 'File size in bytes', optional: true },
    modified: { type: 'string', description: 'Last modified timestamp', optional: true },
    isFolder: { type: 'boolean', description: 'Whether the item is a folder' },
  },
}
