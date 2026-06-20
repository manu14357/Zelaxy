import type {
  GoogleGroupsListMembersParams,
  GoogleGroupsListResponse,
} from '@/tools/google_groups/types'
import type { ToolConfig } from '@/tools/types'

export const listMembersTool: ToolConfig<GoogleGroupsListMembersParams, GoogleGroupsListResponse> =
  {
    id: 'google_groups_list_members',
    name: 'Google Groups List Members',
    description: 'List all members of a Google Group',
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
      maxResults: {
        type: 'number',
        required: false,
        visibility: 'user-or-llm',
        description: 'Maximum number of results to return (1-200)',
      },
    },

    request: {
      url: (params) => {
        const url = new URL(
          `https://admin.googleapis.com/admin/directory/v1/groups/${encodeURIComponent(params.groupKey)}/members`
        )
        if (params.maxResults) url.searchParams.set('maxResults', String(params.maxResults))
        return url.toString()
      },
      method: 'GET',
      headers: (params) => ({
        Authorization: `Bearer ${params.accessToken}`,
        'Content-Type': 'application/json',
      }),
    },

    transformResponse: async (response) => {
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to list group members')
      }
      const members = data.members || []
      return {
        success: true,
        output: {
          data: members,
          metadata: { count: members.length, nextPageToken: data.nextPageToken },
        },
      }
    },

    outputs: {
      data: { type: 'json', description: 'Array of Google Group member objects' },
      metadata: {
        type: 'json',
        description: 'List metadata',
        properties: {
          count: { type: 'number', description: 'Number of members returned' },
          nextPageToken: { type: 'string', description: 'Token for fetching the next page' },
        },
      },
    },
  }
