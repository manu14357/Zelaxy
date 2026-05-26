import type { ToolConfig } from '@/tools/types'

export const dropboxListFolderTool: ToolConfig = {
  id: 'dropbox_list_folder',
  name: 'Dropbox List Folder',
  description: 'List the contents of a Dropbox folder.',
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
      description: 'Path to the folder in Dropbox (use "" for root)',
    },
  },

  request: {
    url: 'https://api.dropboxapi.com/2/files/list_folder',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      path: params.path,
      recursive: false,
      include_deleted: false,
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
        entries: data.entries ?? [],
        cursor: data.cursor ?? null,
        hasMore: data.has_more ?? false,
      },
    }
  },

  outputs: {
    entries: { type: 'json', description: 'Array of file and folder entries' },
    cursor: { type: 'string', description: 'Cursor for pagination', optional: true },
    hasMore: { type: 'boolean', description: 'Whether there are more entries' },
  },
}
