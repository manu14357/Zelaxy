import { DatabaseIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const AirweaveBlock: BlockConfig = {
  type: 'airweave',
  name: 'Airweave',
  description: 'Search and retrieve data from Airweave collections',
  longDescription:
    'Integrate Airweave semantic search into your workflows. Query collections with natural language, use hybrid search strategies, and generate AI-powered answers.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#6366F1',
  icon: DatabaseIcon,
  subBlocks: [
    {
      id: 'collectionId',
      title: 'Collection ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'collection-id',
      required: true,
    },
    {
      id: 'query',
      title: 'Query',
      type: 'long-input',
      layout: 'full',
      placeholder: 'What do you want to search for?',
      required: true,
    },
    {
      id: 'limit',
      title: 'Result Limit',
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
      id: 'retrievalStrategy',
      title: 'Retrieval Strategy',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'Auto', id: 'auto' },
        { label: 'Semantic', id: 'semantic' },
        { label: 'Keyword', id: 'keyword' },
        { label: 'Hybrid', id: 'hybrid' },
      ],
    },
    {
      id: 'generateAnswer',
      title: 'Generate Answer',
      type: 'switch',
      layout: 'half',
    },
    {
      id: 'rerank',
      title: 'Rerank Results',
      type: 'switch',
      layout: 'half',
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      password: true,
      placeholder: 'Your Airweave API key',
      required: true,
    },
  ],
  tools: {
    access: ['airweave_search'],
    config: {
      tool: () => 'airweave_search',
    },
  },
  inputs: {
    collectionId: { type: 'string', description: 'Collection ID' },
    query: { type: 'string', description: 'Search query' },
    limit: { type: 'string', description: 'Max results' },
    retrievalStrategy: { type: 'string', description: 'Retrieval strategy' },
    generateAnswer: { type: 'boolean', description: 'Whether to generate an AI answer' },
    rerank: { type: 'boolean', description: 'Whether to rerank results' },
    apiKey: { type: 'string', description: 'API key' },
  },
  outputs: {
    results: { type: 'json', description: 'Search results' },
    completion: { type: 'string', description: 'Generated answer' },
  },
}
