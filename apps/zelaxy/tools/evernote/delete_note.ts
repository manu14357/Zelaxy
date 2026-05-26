import type { ToolConfig } from '@/tools/types'

export const evernoteDeleteNoteTool: ToolConfig = {
  id: 'evernote_delete_note',
  name: 'Evernote Delete Note',
  description: 'Delete a note from Evernote by its GUID.',
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
      description: 'GUID of the note to delete',
    },
  },

  request: {
    url: '/api/tools/evernote/delete-note',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({ apiKey: params.apiKey, noteGuid: params.noteGuid }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!(data as { success?: boolean }).success) {
      throw new Error((data as { error?: string }).error || 'Evernote API error')
    }
    return {
      success: true,
      output: {
        success: true,
        noteGuid: data.noteGuid ?? '',
      },
    }
  },

  outputs: {
    success: { type: 'boolean', description: 'Whether the note was deleted' },
    noteGuid: { type: 'string', description: 'GUID of the deleted note' },
  },
}
