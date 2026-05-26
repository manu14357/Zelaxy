import type { AsanaGetTaskParams, AsanaGetTaskResponse } from '@/tools/asana/types'
import type { ToolConfig } from '@/tools/types'

export const asanaGetTaskTool: ToolConfig<AsanaGetTaskParams, AsanaGetTaskResponse> = {
  id: 'asana_get_task',
  name: 'Asana Get Task',
  description: 'Retrieve a single task by GID or get multiple tasks with filters',
  version: '1.0.0',

  oauth: { required: true, provider: 'asana' },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'OAuth access token for Asana',
    },
    taskGid: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description:
        'The globally unique identifier (GID) of the task. If not provided, will get multiple tasks.',
    },
    workspace: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Asana workspace GID to filter tasks (required when not using taskGid)',
    },
    project: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Asana project GID to filter tasks',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of tasks to return (default: 50)',
    },
  },

  request: {
    url: '/api/tools/asana/get-task',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      accessToken: params.accessToken,
      taskGid: params.taskGid,
      workspace: params.workspace,
      project: params.project,
      limit: params.limit,
    }),
  },

  transformResponse: async (response: Response) => {
    const responseText = await response.text()
    if (!responseText) {
      return { success: false, output: {}, error: 'Empty response from Asana' }
    }
    const data = JSON.parse(responseText)
    const { success, error, ...output } = data
    return { success: success ?? true, output, error }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the response' },
    gid: { type: 'string', description: 'Task GID' },
    name: { type: 'string', description: 'Task name' },
    notes: { type: 'string', description: 'Task notes' },
    completed: { type: 'boolean', description: 'Whether the task is completed' },
    assignee: { type: 'json', description: 'Assignee details' },
    due_on: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
    created_at: { type: 'string', description: 'Task creation timestamp' },
    modified_at: { type: 'string', description: 'Task last modified timestamp' },
    tasks: { type: 'array', description: 'Array of tasks (when fetching multiple)' },
  },
}
