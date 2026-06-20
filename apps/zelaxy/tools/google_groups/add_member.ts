import type {
  GoogleGroupsAddMemberParams,
  GoogleGroupsObjectResponse,
} from '@/tools/google_groups/types'
import type { ToolConfig } from '@/tools/types'

export const addMemberTool: ToolConfig<GoogleGroupsAddMemberParams, GoogleGroupsObjectResponse> = {
  id: 'google_groups_add_member',
  name: 'Google Groups Add Member',
  description: 'Add a new member to a Google Group',
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
    email: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Email address of the member to add (e.g., user@example.com)',
    },
    role: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Role for the member: MEMBER, MANAGER, or OWNER. Defaults to MEMBER',
    },
  },

  request: {
    url: (params) =>
      `https://admin.googleapis.com/admin/directory/v1/groups/${encodeURIComponent(params.groupKey)}/members`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      email: params.email,
      role: params.role || 'MEMBER',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to add member to group')
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
    data: { type: 'json', description: 'The added Google Group member object' },
    metadata: {
      type: 'json',
      description: 'Member identifiers',
      properties: {
        id: { type: 'string', description: 'Member ID' },
        email: { type: 'string', description: 'Member email address' },
      },
    },
  },
}
