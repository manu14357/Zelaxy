import { ReductoIcon } from '@/components/icons/reducto-icon'
import type { BlockConfig } from '@/blocks/types'
import type { ReductoResponse } from '@/tools/reducto/types'

export const ReductoBlock: BlockConfig<ReductoResponse> = {
  type: 'reducto',
  name: 'Reducto',
  description: 'Parse, extract, and split documents with Reducto',
  longDescription:
    'Parse documents into structured content, extract data against a JSON schema, and split documents into sections using the Reducto document API. Authenticate with a Reducto API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#6D28D9',
  icon: ReductoIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Parse', id: 'reducto_parse' },
        { label: 'Extract', id: 'reducto_extract' },
        { label: 'Split', id: 'reducto_split' },
      ],
      value: () => 'reducto_parse',
    },
    {
      id: 'documentUrl',
      title: 'Document URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://example.com/document.pdf',
      condition: {
        field: 'operation',
        value: ['reducto_parse', 'reducto_extract', 'reducto_split'],
      },
    },
    // Extract
    {
      id: 'schema',
      title: 'Extraction Schema',
      type: 'long-input',
      layout: 'full',
      placeholder: '{"type":"object","properties":{"total":{"type":"number"}}}',
      condition: { field: 'operation', value: 'reducto_extract' },
    },
    {
      id: 'systemPrompt',
      title: 'System Prompt',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Be precise and thorough.',
      condition: { field: 'operation', value: 'reducto_extract' },
    },
    // Split
    {
      id: 'splitDescription',
      title: 'Split Description',
      type: 'long-input',
      layout: 'full',
      placeholder: '[{"name":"invoice","description":"Pages containing an invoice"}]',
      condition: { field: 'operation', value: 'reducto_split' },
    },
    // Auth
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Reducto API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['reducto_parse', 'reducto_extract', 'reducto_split'],
    config: {
      tool: (params) => params.operation || 'reducto_parse',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Reducto API key' },
    documentUrl: { type: 'string', description: 'URL of the document' },
    schema: { type: 'json', description: 'Extraction JSON schema' },
    systemPrompt: { type: 'string', description: 'Extraction system prompt' },
    splitDescription: { type: 'json', description: 'Split category definitions' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from Reducto' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
