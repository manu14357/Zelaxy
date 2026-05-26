import type { ToolConfig } from '@/tools/types'

export const evernoteCreateNoteTool: ToolConfig = {
  id: 'evernote_create_note',
  name: 'Evernote Create Note',
  description: 'Create a new note in Evernote.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Evernote developer token (API key)',
    },
    title: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Title of the note',
    },
    content: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Content of the note (plain text or ENML)',
    },
    notebookGuid: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'GUID of the notebook to create the note in',
    },
    tagNames: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated list of tag names',
    },
  },

  request: {
    url: '/api/tools/evernote/create-note',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      apiKey: params.apiKey,
      title: params.title,
      content: params.content,
      notebookGuid: params.notebookGuid || null,
      tagNames: params.tagNames || null,
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
    note: { type: 'json', description: 'The created note object' },
  },
}
