import { ContextDevIcon } from '@/components/icons/context-dev-icon'
import type { BlockConfig } from '@/blocks/types'
import type { ContextDevResponse } from '@/tools/context_dev/types'

export const ContextDevBlock: BlockConfig<ContextDevResponse> = {
  type: 'context_dev',
  name: 'Context.dev',
  description: 'Search, scrape, and crawl the web for LLM-ready content',
  longDescription:
    'Search the web with natural language, scrape any URL to clean markdown, and crawl entire websites into LLM-ready content through the Context.dev API. Authenticate with an API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#6366F1',
  icon: ContextDevIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Search', id: 'context_dev_search' },
        { label: 'Scrape markdown', id: 'context_dev_scrape_markdown' },
        { label: 'Crawl', id: 'context_dev_crawl' },
      ],
      value: () => 'context_dev_search',
    },
    {
      id: 'query',
      title: 'Query',
      type: 'long-input',
      layout: 'full',
      placeholder: 'What is the latest news about...',
      condition: { field: 'operation', value: 'context_dev_search' },
    },
    {
      id: 'markdownEnabled',
      title: 'Scrape Results to Markdown',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'No', id: 'false' },
        { label: 'Yes', id: 'true' },
      ],
      condition: { field: 'operation', value: 'context_dev_search' },
    },
    {
      id: 'url',
      title: 'URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://example.com',
      condition: {
        field: 'operation',
        value: ['context_dev_scrape_markdown', 'context_dev_crawl'],
      },
    },
    {
      id: 'useMainContentOnly',
      title: 'Main Content Only',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'No', id: 'false' },
        { label: 'Yes', id: 'true' },
      ],
      condition: { field: 'operation', value: 'context_dev_scrape_markdown' },
    },
    {
      id: 'includeLinks',
      title: 'Include Links',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'Yes', id: 'true' },
        { label: 'No', id: 'false' },
      ],
      condition: { field: 'operation', value: 'context_dev_scrape_markdown' },
    },
    {
      id: 'maxPages',
      title: 'Max Pages',
      type: 'short-input',
      layout: 'half',
      placeholder: '100',
      condition: { field: 'operation', value: 'context_dev_crawl' },
    },
    {
      id: 'maxDepth',
      title: 'Max Depth',
      type: 'short-input',
      layout: 'half',
      placeholder: '2',
      condition: { field: 'operation', value: 'context_dev_crawl' },
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Context.dev API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['context_dev_search', 'context_dev_scrape_markdown', 'context_dev_crawl'],
    config: {
      tool: (params) => params.operation || 'context_dev_search',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Context.dev API key' },
    query: { type: 'string', description: 'Search query' },
    markdownEnabled: { type: 'boolean', description: 'Scrape search results to markdown' },
    url: { type: 'string', description: 'URL to scrape or crawl' },
    useMainContentOnly: { type: 'boolean', description: 'Return only main content' },
    includeLinks: { type: 'boolean', description: 'Preserve hyperlinks in markdown' },
    maxPages: { type: 'number', description: 'Maximum pages to crawl' },
    maxDepth: { type: 'number', description: 'Maximum crawl link depth' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Context.dev' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
