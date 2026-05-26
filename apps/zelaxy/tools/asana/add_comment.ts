import type { AsanaAddCommentParams, AsanaAddCommentResponse } from '@/tools/asana/types'
import type { ToolConfig } from '@/tools/types'

export const asanaAddCommentTool: ToolConfig<AsanaAddCommentParams, AsanaAddCommentResponse> = {
  id: 'asana_add_comment',
  name: 'Asana Add Comment',
  description: 'Add a comment (story) to an Asana task',
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
      description: 'Asana task GID',
    },
    text: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The text content of the comment',
    },
  },

  request: {
    url: '/api/tools/asana/add-comment',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      accessToken: params.accessToken,
      taskGid: params.taskGid,
      text: params.text,
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
    gid: { type: 'string', description: 'Comment GID' },
    text: { type: 'string', description: 'Comment text content' },
    created_at: { type: 'string', description: 'Comment creation timestamp' },
    created_by: { type: 'json', description: 'Comment author details' },
  },
}
