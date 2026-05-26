import type { AsanaDeleteTaskParams, AsanaDeleteTaskResponse } from '@/tools/asana/types'
import type { ToolConfig } from '@/tools/types'

export const asanaDeleteTaskTool: ToolConfig<AsanaDeleteTaskParams, AsanaDeleteTaskResponse> = {
  id: 'asana_delete_task',
  name: 'Asana Delete Task',
  description: 'Delete a task from Asana by its GID',
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
      required: true,
      visibility: 'user-or-llm',
      description: 'The globally unique identifier (GID) of the task to delete',
    },
  },

  request: {
    url: '/api/tools/asana/delete-task',
    method: 'DELETE',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      accessToken: params.accessToken,
      taskGid: params.taskGid,
    }),
  },

  transformResponse: async (response: Response) => {
    const responseText = await response.text()
    if (!responseText) {
      return {
        success: false,
        output: { ts: new Date().toISOString(), deleted: false, taskGid: '' },
        error: 'Empty response from Asana',
      }
    }
    const data = JSON.parse(responseText)
    const { success, error, ...output } = data
    return { success: success ?? true, output, error }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the response' },
    deleted: { type: 'boolean', description: 'Whether the task was deleted' },
    taskGid: { type: 'string', description: 'GID of the deleted task' },
  },
}
