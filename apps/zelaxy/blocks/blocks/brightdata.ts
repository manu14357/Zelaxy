import { BrowserUseIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const BrightDataBlock: BlockConfig = {
  type: 'brightdata',
  name: 'Bright Data',
  description: 'Scrape web pages, run SERP searches, and discover data with Bright Data',
  longDescription:
    'Integrate Bright Data web intelligence into your workflows. Scrape any URL, run search engine queries, and discover related pages.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#00A89C',
  icon: BrowserUseIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Scrape URL', id: 'brightdata_scrape_url' },
        { label: 'SERP Search', id: 'brightdata_serp_search' },
        { label: 'Discover URLs', id: 'brightdata_discover' },
      ],
      required: true,
    },
    {
      id: 'zone',
      title: 'Zone',
      type: 'short-input',
      layout: 'full',
      placeholder: 'your_zone',
      required: true,
    },
    {
      id: 'url',
      title: 'URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://example.com',
      condition: { field: 'operation', value: ['brightdata_scrape_url', 'brightdata_discover'] },
    },
    {
      id: 'query',
      title: 'Search Query',
      type: 'short-input',
      layout: 'full',
      placeholder: 'best laptops 2024',
      condition: { field: 'operation', value: ['brightdata_serp_search'] },
    },
    {
      id: 'format',
      title: 'Format',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'Raw HTML', id: 'raw' },
        { label: 'JSON', id: 'json' },
      ],
      condition: { field: 'operation', value: ['brightdata_scrape_url'] },
    },
    {
      id: 'searchEngine',
      title: 'Search Engine',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'Google', id: 'google' },
        { label: 'Bing', id: 'bing' },
        { label: 'DuckDuckGo', id: 'duckduckgo' },
      ],
      condition: { field: 'operation', value: ['brightdata_serp_search'] },
    },
  ],
  tools: {
    access: ['brightdata_scrape_url', 'brightdata_serp_search', 'brightdata_discover'],
    config: {
      tool: (params) => params.operation || 'brightdata_scrape_url',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    zone: { type: 'string', description: 'Bright Data zone' },
    url: { type: 'string', description: 'Target URL' },
    query: { type: 'string', description: 'Search query' },
    format: { type: 'string', description: 'Output format' },
    searchEngine: { type: 'string', description: 'Search engine' },
  },
  outputs: {
    html: { type: 'string', description: 'Raw HTML content' },
    json: { type: 'json', description: 'Structured data' },
    results: { type: 'json', description: 'Search results' },
  },
}
