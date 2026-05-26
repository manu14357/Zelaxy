import type { ToolConfig } from '@/tools/types'

export const evernoteSearchNotesTool: ToolConfig = {
  id: 'evernote_search_notes',
  name: 'Evernote Search Notes',
  description: 'Search for notes in Evernote using a query string.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Evernote developer token (API key)',
    },
    query: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Search query (Evernote search syntax supported)',
    },
    maxNotes: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of notes to return (default: 20)',
    },
    notebookGuid: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Restrict search to a specific notebook GUID',
    },
  },

  request: {
    url: '/api/tools/evernote/search-notes',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      apiKey: params.apiKey,
      query: params.query,
      maxNotes: Number(params.maxNotes) || 20,
      ...(params.notebookGuid ? { notebookGuid: params.notebookGuid } : {}),
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!(data as { success?: boolean }).success) {
      throw new Error((data as { error?: string }).error || 'Evernote API error')
    }
    return {
      success: true,
      output: {
        notes: data.notes ?? [],
        total: data.total ?? 0,
      },
    }
  },

  outputs: {
    notes: { type: 'json', description: 'Array of matching notes' },
    total: { type: 'number', description: 'Total number of matching notes' },
  },
}
