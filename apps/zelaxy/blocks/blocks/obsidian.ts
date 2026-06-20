import { ObsidianIcon } from '@/components/icons/obsidian-icon'
import type { BlockConfig } from '@/blocks/types'
import type { ObsidianResponse } from '@/tools/obsidian/types'

export const ObsidianBlock: BlockConfig<ObsidianResponse> = {
  type: 'obsidian',
  name: 'Obsidian',
  description: 'Read and search notes in your Obsidian vault',
  longDescription:
    'List files, read note content, and search across your Obsidian vault through the Local REST API plugin. Authenticate with the plugin base URL and API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#7C3AED',
  icon: ObsidianIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List files', id: 'obsidian_list_files' },
        { label: 'Get file', id: 'obsidian_get_file' },
        { label: 'Search', id: 'obsidian_search' },
      ],
      value: () => 'obsidian_list_files',
    },
    // List files
    {
      id: 'path',
      title: 'Path',
      type: 'short-input',
      layout: 'full',
      placeholder: 'folder/subfolder (leave empty for root)',
      condition: { field: 'operation', value: 'obsidian_list_files' },
    },
    // Get file
    {
      id: 'filename',
      title: 'Filename',
      type: 'short-input',
      layout: 'full',
      placeholder: 'folder/note.md',
      condition: { field: 'operation', value: 'obsidian_get_file' },
    },
    // Search
    {
      id: 'query',
      title: 'Query',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Text to search for',
      condition: { field: 'operation', value: 'obsidian_search' },
    },
    // Auth
    {
      id: 'baseUrl',
      title: 'Base URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://127.0.0.1:27124',
      required: true,
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Obsidian Local REST API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['obsidian_list_files', 'obsidian_get_file', 'obsidian_search'],
    config: {
      tool: (params) => params.operation || 'obsidian_list_files',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Obsidian Local REST API key' },
    baseUrl: { type: 'string', description: 'Base URL for the Obsidian Local REST API' },
    path: { type: 'string', description: 'Directory path relative to vault root' },
    filename: { type: 'string', description: 'File path relative to vault root' },
    query: { type: 'string', description: 'Search query' },
  },
  outputs: {
    data: { type: 'json', description: 'Result from Obsidian' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
