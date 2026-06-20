import type { GongListResponse, GongListUsersParams } from '@/tools/gong/types'
import type { ToolConfig } from '@/tools/types'

export const listUsersTool: ToolConfig<GongListUsersParams, GongListResponse> = {
  id: 'gong_list_users',
  name: 'Gong List Users',
  description: 'List all users in your Gong account',
  version: '1.0.0',

  params: {
    accessKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Gong API Access Key',
    },
    accessKeySecret: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Gong API Access Key Secret',
    },
  },

  request: {
    url: () => 'https://api.gong.io/v2/users',
    method: 'GET',
    headers: (params) => ({
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${params.accessKey}:${params.accessKeySecret}`).toString('base64')}`,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const users = data.users || []
    return {
      success: true,
      output: {
        data: users,
        metadata: { count: users.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Gong user objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
      },
    },
  },
}
