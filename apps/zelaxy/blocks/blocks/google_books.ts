import { GoogleBooksIcon } from '@/components/icons/google-books-icon'
import type { BlockConfig } from '@/blocks/types'
import type { GoogleBooksResponse } from '@/tools/google_books/types'

export const GoogleBooksBlock: BlockConfig<GoogleBooksResponse> = {
  type: 'google_books',
  name: 'Google Books',
  description: 'Search for books and fetch volume details',
  longDescription:
    'Search the Google Books catalog and retrieve detailed information about a specific volume. Authenticate with a Google Books API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#4285F4',
  icon: GoogleBooksIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Search volumes', id: 'google_books_search_volumes' },
        { label: 'Get volume', id: 'google_books_get_volume' },
      ],
      value: () => 'google_books_search_volumes',
    },
    // Search volumes
    {
      id: 'q',
      title: 'Query',
      type: 'short-input',
      layout: 'full',
      placeholder: 'intitle:flowers inauthor:keyes',
      condition: { field: 'operation', value: 'google_books_search_volumes' },
    },
    {
      id: 'maxResults',
      title: 'Max Results',
      type: 'short-input',
      layout: 'half',
      placeholder: '10',
      condition: { field: 'operation', value: 'google_books_search_volumes' },
    },
    // Get volume
    {
      id: 'volumeId',
      title: 'Volume ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'zyTCAlFPjgYC',
      condition: { field: 'operation', value: 'google_books_get_volume' },
    },
    {
      id: 'apiKey',
      title: 'Google Books API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your Google Books API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['google_books_search_volumes', 'google_books_get_volume'],
    config: {
      tool: (params) => params.operation || 'google_books_search_volumes',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Google Books API key' },
    q: { type: 'string', description: 'Search query' },
    maxResults: { type: 'number', description: 'Maximum number of results' },
    volumeId: { type: 'string', description: 'Volume ID to retrieve' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Google Books' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
