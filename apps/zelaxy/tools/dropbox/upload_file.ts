import type { ToolConfig } from '@/tools/types'

export const dropboxUploadFileTool: ToolConfig = {
  id: 'dropbox_upload_file',
  name: 'Dropbox Upload File',
  description: 'Upload a file to Dropbox.',
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
      description: 'Destination path in Dropbox (e.g., /folder/file.txt)',
    },
    content: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'File content to upload',
    },
    mode: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Write mode: add, overwrite, or update (default: add)',
    },
    autorename: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Automatically rename if conflict exists (default: false)',
    },
  },

  request: {
    url: '/api/tools/dropbox/upload',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      accessToken: params.accessToken,
      path: params.path,
      content: params.content,
      mode: params.mode || 'add',
      autorename: params.autorename ?? false,
    }),
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
        size: data.size ?? 0,
        modified: data.client_modified ?? data.server_modified ?? null,
      },
    }
  },

  outputs: {
    id: { type: 'string', description: 'File ID' },
    path: { type: 'string', description: 'File path in Dropbox' },
    name: { type: 'string', description: 'File name' },
    size: { type: 'number', description: 'File size in bytes' },
    modified: { type: 'string', description: 'Last modified timestamp', optional: true },
  },
}
