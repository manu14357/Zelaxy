import type { ToolConfig } from '@/tools/types'

export const evernoteUpdateNoteTool: ToolConfig = {
  id: 'evernote_update_note',
  name: 'Evernote Update Note',
  description: 'Update an existing note in Evernote.',
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
      description: 'GUID of the note to update',
    },
    title: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'New title for the note',
    },
    content: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'New content for the note',
    },
    tagNames: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated list of tag names',
    },
  },

  request: {
    url: '/api/tools/evernote/update-note',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      apiKey: params.apiKey,
      noteGuid: params.noteGuid,
      ...(params.title ? { title: params.title } : {}),
      ...(params.content ? { content: params.content } : {}),
      ...(params.tagNames ? { tagNames: params.tagNames } : {}),
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!(data as { success?: boolean }).success) {
      throw new Error((data as { error?: string }).error || 'Evernote API error')
    }
    return { success: true, output: { note: data.note ?? null } }
  },

  outputs: {
    note: { type: 'json', description: 'The updated note object' },
  },
}
