import type { GoogleTasksListResponse, ListTasksParams } from '@/tools/google_tasks/types'
import type { ToolConfig } from '@/tools/types'

export const listTasksTool: ToolConfig<ListTasksParams, GoogleTasksListResponse> = {
  id: 'google_tasks_list_tasks',
  name: 'Google Tasks List Tasks',
  description: 'List all tasks in a Google Tasks list',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Google OAuth access token',
    },
    tasklist: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Task list ID (defaults to "@default")',
    },
    maxResults: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of tasks to return (max 100)',
    },
    showCompleted: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Whether to include completed tasks',
    },
  },

  request: {
    url: (params) => {
      const tasklist = params.tasklist || '@default'
      const url = new URL(
        `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(tasklist)}/tasks`
      )
      if (params.maxResults) url.searchParams.append('maxResults', String(params.maxResults))
      if (params.showCompleted !== undefined)
        url.searchParams.append('showCompleted', String(params.showCompleted))
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
    data: { type: 'json', description: 'Array of task objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of tasks returned' },
        nextPageToken: { type: 'string', description: 'Token for the next page' },
      },
    },
  },
}
