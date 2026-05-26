import { BrowserUseIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const ApifyBlock: BlockConfig = {
  type: 'apify',
  name: 'Apify',
  description: 'Run web scraping and automation actors on Apify',
  longDescription:
    'Integrate Apify web automation into your workflows. Run actors synchronously or asynchronously, extract web data, and retrieve datasets.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#E0E0E0',
  icon: BrowserUseIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Run Actor (Sync)', id: 'apify_run_actor_sync' },
        { label: 'Run Actor (Async)', id: 'apify_run_actor_async' },
        { label: 'Get Run', id: 'apify_get_run' },
        { label: 'Get Dataset', id: 'apify_get_dataset' },
      ],
      required: true,
    },
    {
      id: 'apiKey',
      title: 'API Token',
      type: 'short-input',
      layout: 'full',
      password: true,
      placeholder: 'Your Apify API token',
      required: true,
    },
    {
      id: 'actorId',
      title: 'Actor ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'apify/web-scraper',
      condition: { field: 'operation', value: ['apify_run_actor_sync', 'apify_run_actor_async'] },
    },
    {
      id: 'input',
      title: 'Actor Input (JSON)',
      type: 'code',
      layout: 'full',
      placeholder: '{"startUrls": [{"url": "https://example.com"}]}',
      condition: { field: 'operation', value: ['apify_run_actor_sync', 'apify_run_actor_async'] },
    },
    {
      id: 'memory',
      title: 'Memory (MB)',
      type: 'short-input',
      layout: 'half',
      placeholder: '256',
      condition: { field: 'operation', value: ['apify_run_actor_sync', 'apify_run_actor_async'] },
    },
    {
      id: 'timeout',
      title: 'Timeout (s)',
      type: 'short-input',
      layout: 'half',
      placeholder: '60',
      condition: { field: 'operation', value: ['apify_run_actor_sync', 'apify_run_actor_async'] },
    },
    {
      id: 'runId',
      title: 'Run ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'run-id',
      condition: { field: 'operation', value: ['apify_get_run', 'apify_get_dataset'] },
    },
  ],
  tools: {
    access: ['apify_run_actor_sync', 'apify_run_actor_async', 'apify_get_run', 'apify_get_dataset'],
    config: {
      tool: (params) => params.operation || 'apify_run_actor_sync',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'API token' },
    actorId: { type: 'string', description: 'Actor ID' },
    input: { type: 'json', description: 'Actor input' },
    memory: { type: 'string', description: 'Memory in MB' },
    timeout: { type: 'string', description: 'Timeout in seconds' },
    runId: { type: 'string', description: 'Run ID' },
  },
  outputs: {
    data: { type: 'json', description: 'Extracted data' },
    datasetId: { type: 'string', description: 'Dataset ID' },
    status: { type: 'string', description: 'Run status' },
  },
}
