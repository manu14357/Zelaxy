import type { GoogleTasksListResponse, ListTaskListsParams } from '@/tools/google_tasks/types'
import type { ToolConfig } from '@/tools/types'

export const listTaskListsTool: ToolConfig<ListTaskListsParams, GoogleTasksListResponse> = {
  id: 'google_tasks_list_tasklists',
  name: 'Google Tasks List Task Lists',
  description: 'Retrieve all task lists for the authenticated user',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Google OAuth access token',
    },
    maxResults: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of task lists to return (max 100)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://tasks.googleapis.com/tasks/v1/users/@me/lists')
      if (params.maxResults) url.searchParams.append('maxResults', String(params.maxResults))
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
    const items = data.items || []
    return {
      success: true,
      output: {
        data: items,
        metadata: { count: items.length, nextPageToken: data.nextPageToken || null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of task list objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of task lists returned' },
        nextPageToken: { type: 'string', description: 'Token for the next page' },
      },
    },
  },
}
