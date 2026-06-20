import type { CompleteTaskParams, GoogleTasksObjectResponse } from '@/tools/google_tasks/types'
import type { ToolConfig } from '@/tools/types'

export const completeTaskTool: ToolConfig<CompleteTaskParams, GoogleTasksObjectResponse> = {
  id: 'google_tasks_complete_task',
  name: 'Google Tasks Complete Task',
  description: 'Mark a task as completed in a Google Tasks list',
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
    task: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the task to complete',
    },
  },

  request: {
    url: (params) => {
      const tasklist = params.tasklist || '@default'
      return `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(tasklist)}/tasks/${encodeURIComponent(params.task)}`
    },
    method: 'PATCH',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: () => ({ status: 'completed' }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The updated task object' },
    metadata: {
      type: 'json',
      description: 'Task identifiers',
      properties: {
        id: { type: 'string', description: 'Task ID' },
      },
    },
  },
}
