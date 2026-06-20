import type { CreateTaskParams, GoogleTasksObjectResponse } from '@/tools/google_tasks/types'
import type { ToolConfig } from '@/tools/types'

export const createTaskTool: ToolConfig<CreateTaskParams, GoogleTasksObjectResponse> = {
  id: 'google_tasks_create_task',
  name: 'Google Tasks Create Task',
  description: 'Create a new task in a Google Tasks list',
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
    title: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Title of the task',
    },
    notes: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Notes/description for the task',
    },
    due: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Due date in RFC 3339 format',
    },
  },

  request: {
    url: (params) => {
      const tasklist = params.tasklist || '@default'
      return `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(tasklist)}/tasks`
    },
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = { title: params.title }
      if (params.notes) body.notes = params.notes
      if (params.due) body.due = params.due
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The created task object' },
    metadata: {
      type: 'json',
      description: 'Task identifiers',
      properties: {
        id: { type: 'string', description: 'Task ID' },
      },
    },
  },
}
