import { DocumentIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const EvernoteBlock: BlockConfig = {
  type: 'evernote',
  name: 'Evernote',
  description: 'Create, update, and search notes in Evernote',
  longDescription:
    'Integrate Evernote note-taking into your workflows. Create, read, update, and search notes and notebooks.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#E0E0E0',
  icon: DocumentIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Create Note', id: 'evernote_create_note' },
        { label: 'Get Note', id: 'evernote_get_note' },
        { label: 'Update Note', id: 'evernote_update_note' },
        { label: 'Delete Note', id: 'evernote_delete_note' },
        { label: 'Search Notes', id: 'evernote_search_notes' },
        { label: 'List Notebooks', id: 'evernote_list_notebooks' },
      ],
      required: true,
    },
    {
      id: 'apiKey',
      title: 'Developer Token',
      type: 'short-input',
      layout: 'full',
      password: true,
      placeholder: 'Your Evernote developer token',
      required: true,
    },
    {
      id: 'title',
      title: 'Title',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Note title',
      condition: { field: 'operation', value: ['evernote_create_note', 'evernote_update_note'] },
    },
    {
      id: 'content',
      title: 'Content',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Note content',
      condition: { field: 'operation', value: ['evernote_create_note', 'evernote_update_note'] },
    },
    {
      id: 'noteGuid',
      title: 'Note GUID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'note-guid',
      condition: {
        field: 'operation',
        value: ['evernote_get_note', 'evernote_update_note', 'evernote_delete_note'],
      },
    },
    {
      id: 'query',
      title: 'Search Query',
      type: 'short-input',
      layout: 'full',
      placeholder: 'notebook:Research tag:important',
      condition: { field: 'operation', value: ['evernote_search_notes'] },
    },
  ],
  tools: {
    access: [
      'evernote_create_note',
      'evernote_get_note',
      'evernote_update_note',
      'evernote_delete_note',
      'evernote_search_notes',
      'evernote_list_notebooks',
    ],
    config: {
      tool: (params) => params.operation || 'evernote_search_notes',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Developer token' },
    title: { type: 'string', description: 'Note title' },
    content: { type: 'string', description: 'Note content' },
    noteGuid: { type: 'string', description: 'Note GUID' },
    query: { type: 'string', description: 'Search query' },
  },
  outputs: {
    note: { type: 'json', description: 'Note data' },
    notes: { type: 'json', description: 'Note list' },
    notebooks: { type: 'json', description: 'Notebook list' },
  },
}
