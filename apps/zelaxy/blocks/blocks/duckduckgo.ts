import { SearchIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const DuckDuckGoBlock: BlockConfig = {
  type: 'duckduckgo',
  name: 'DuckDuckGo',
  description: 'Search the web with DuckDuckGo for privacy-respecting results',
  longDescription:
    'Integrate DuckDuckGo search into your workflows. Perform web searches, get news results, and find images without tracking.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#DE5833',
  icon: SearchIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Web Search', id: 'duckduckgo_text_search' },
        { label: 'News Search', id: 'duckduckgo_news_search' },
        { label: 'Image Search', id: 'duckduckgo_images_search' },
      ],
      required: true,
    },
    {
      id: 'query',
      title: 'Search Query',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Enter your search query',
      required: true,
    },
    {
      id: 'maxResults',
      title: 'Max Results',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: '5', id: '5' },
        { label: '10', id: '10' },
        { label: '20', id: '20' },
        { label: '50', id: '50' },
      ],
    },
    {
      id: 'region',
      title: 'Region',
      type: 'short-input',
      layout: 'half',
      placeholder: 'wt-wt',
    },
  ],
  tools: {
    access: ['duckduckgo_text_search', 'duckduckgo_news_search', 'duckduckgo_images_search'],
    config: {
      tool: (params) => params.operation || 'duckduckgo_text_search',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    query: { type: 'string', description: 'Search query' },
    maxResults: { type: 'string', description: 'Maximum number of results' },
    region: { type: 'string', description: 'Search region' },
  },
  outputs: {
    results: { type: 'json', description: 'Search results' },
    news: { type: 'json', description: 'News results' },
    images: { type: 'json', description: 'Image results' },
  },
}
