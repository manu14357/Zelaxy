import type { ToolConfig } from '@/tools/types'

export const boxListFolderTool: ToolConfig = {
  id: 'box_list_folder',
  name: 'Box List Folder',
  description: 'List files and folders in a Box folder.',
  version: '1.0.0',

  oauth: {
    required: true,
    provider: 'box',
  },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'OAuth access token for Box API',
    },
    folderId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the folder to list (use "0" for root)',
    },
  },

  request: {
    url: (params) => `https://api.box.com/2.0/folders/${params.folderId.trim()}/items?limit=100`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || `Box API error: ${response.status}`)
    }
    return {
      success: true,
      output: {
        entries: (data.entries ?? []).map((item: Record<string, unknown>) => ({
          type: item.type ?? '',
          id: item.id ?? '',
          name: item.name ?? '',
          size: item.size ?? null,
          createdAt: item.created_at ?? null,
          modifiedAt: item.modified_at ?? null,
        })),
        totalCount: data.total_count ?? 0,
      },
    }
  },

  outputs: {
    entries: { type: 'array', description: 'List of items in the folder' },
    totalCount: { type: 'number', description: 'Total number of items' },
  },
}
