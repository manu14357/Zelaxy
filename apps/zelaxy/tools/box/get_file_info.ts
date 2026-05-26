import type { ToolConfig } from '@/tools/types'

export const boxGetFileInfoTool: ToolConfig = {
  id: 'box_get_file_info',
  name: 'Box Get File Info',
  description: 'Get detailed information about a file in Box.',
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
    fileId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the file to get information about',
    },
  },

  request: {
    url: (params) => `https://api.box.com/2.0/files/${params.fileId.trim()}`,
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
        id: data.id ?? '',
        name: data.name ?? '',
        size: data.size ?? 0,
        sha1: data.sha1 ?? null,
        createdAt: data.created_at ?? null,
        modifiedAt: data.modified_at ?? null,
        parentId: data.parent?.id ?? null,
        parentName: data.parent?.name ?? null,
        sharedLink: data.shared_link ?? null,
        tags: data.tags ?? [],
      },
    }
  },

  outputs: {
    id: { type: 'string', description: 'File ID' },
    name: { type: 'string', description: 'File name' },
    size: { type: 'number', description: 'File size in bytes' },
    sha1: { type: 'string', description: 'SHA1 hash' },
    createdAt: { type: 'string', description: 'Creation timestamp' },
    modifiedAt: { type: 'string', description: 'Last modified timestamp' },
    parentId: { type: 'string', description: 'Parent folder ID' },
    sharedLink: { type: 'json', description: 'Shared link details' },
  },
}
