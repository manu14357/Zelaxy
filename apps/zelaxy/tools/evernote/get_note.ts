import type { ToolConfig } from '@/tools/types'

export const evernoteGetNoteTool: ToolConfig = {
  id: 'evernote_get_note',
  name: 'Evernote Get Note',
  description: 'Retrieve a note from Evernote by its GUID.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Evernote developer token (API key)',
    },
    noteGuid: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'GUID of the note to retrieve',
    },
  },

  request: {
    url: '/api/tools/evernote/get-note',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({ apiKey: params.apiKey, noteGuid: params.noteGuid }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!(data as { success?: boolean }).success) {
      throw new Error((data as { error?: string }).error || 'Evernote API error')
    }
    return { success: true, output: { note: data.note ?? null } }
  },

  outputs: {
    note: {
      type: 'json',
      description:
        'Note object with guid, title, content, notebookGuid, tagNames, created, updated',
    },
  },
}
