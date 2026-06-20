import { ExtendIcon } from '@/components/icons/extend-icon'
import type { BlockConfig } from '@/blocks/types'
import type { ExtendResponse } from '@/tools/extend/types'

export const ExtendBlock: BlockConfig<ExtendResponse> = {
  type: 'extend',
  name: 'Extend',
  description: 'Parse and extract structured content from documents with Extend',
  longDescription:
    'Parse documents into structured markdown or spatial content and retrieve processor run results through the Extend AI API. Authenticate with an Extend API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#111827',
  icon: ExtendIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Parse document', id: 'extend_parse' },
        { label: 'Get run', id: 'extend_get_run' },
      ],
      value: () => 'extend_parse',
    },
    // Parse document
    {
      id: 'fileUrl',
      title: 'File URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://example.com/document.pdf',
      condition: { field: 'operation', value: 'extend_parse' },
    },
    {
      id: 'outputFormat',
      title: 'Output Format',
      type: 'short-input',
      layout: 'half',
      placeholder: 'markdown',
      condition: { field: 'operation', value: 'extend_parse' },
    },
    {
      id: 'chunking',
      title: 'Chunking Strategy',
      type: 'short-input',
      layout: 'half',
      placeholder: 'page',
      condition: { field: 'operation', value: 'extend_parse' },
    },
    {
      id: 'engine',
      title: 'Engine',
      type: 'short-input',
      layout: 'full',
      placeholder: 'parse_performance',
      condition: { field: 'operation', value: 'extend_parse' },
    },
    // Get run
    {
      id: 'runId',
      title: 'Run ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'run_...',
      condition: { field: 'operation', value: 'extend_get_run' },
    },
    {
      id: 'apiKey',
      title: 'Extend API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Extend API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['extend_parse', 'extend_get_run'],
    config: {
      tool: (params) => params.operation || 'extend_parse',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Extend API key' },
    fileUrl: { type: 'string', description: 'URL of the document to parse' },
    outputFormat: { type: 'string', description: 'Target output format' },
    chunking: { type: 'string', description: 'Chunking strategy' },
    engine: { type: 'string', description: 'Parsing engine' },
    runId: { type: 'string', description: 'Processor run ID' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from Extend' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
