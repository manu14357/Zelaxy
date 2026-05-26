import type { ToolConfig } from '@/tools/types'

export const evernoteListNotebooksTool: ToolConfig = {
  id: 'evernote_list_notebooks',
  name: 'Evernote List Notebooks',
  description: 'List all notebooks in the Evernote account.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Evernote developer token (API key)',
    },
  },

  request: {
    url: '/api/tools/evernote/list-notebooks',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({ apiKey: params.apiKey }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!(data as { success?: boolean }).success) {
      throw new Error((data as { error?: string }).error || 'Evernote API error')
    }
    return { success: true, output: { notebooks: data.notebooks ?? [] } }
  },

  outputs: {
    notebooks: { type: 'json', description: 'Array of notebook objects' },
  },
}
