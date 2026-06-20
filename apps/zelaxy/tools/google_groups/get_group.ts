import type {
  GoogleGroupsGetGroupParams,
  GoogleGroupsObjectResponse,
} from '@/tools/google_groups/types'
import type { ToolConfig } from '@/tools/types'

export const getGroupTool: ToolConfig<GoogleGroupsGetGroupParams, GoogleGroupsObjectResponse> = {
  id: 'google_groups_get_group',
  name: 'Google Groups Get Group',
  description: 'Get details of a specific Google Group by email or group ID',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'OAuth access token for Google Groups',
    },
    groupKey: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Group email address (e.g., team@example.com) or the unique group ID',
    },
  },

  request: {
    url: (params) =>
      `https://admin.googleapis.com/admin/directory/v1/groups/${encodeURIComponent(params.groupKey)}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to get group')
    }
    return {
      success: true,
      output: {
        data,
        metadata: { id: data.id, email: data.email },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Google Group object' },
    metadata: {
      type: 'json',
      description: 'Group identifiers',
      properties: {
        id: { type: 'string', description: 'Group ID' },
        email: { type: 'string', description: 'Group email address' },
      },
    },
  },
}
