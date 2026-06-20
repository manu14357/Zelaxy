import { DatagmaIcon } from '@/components/icons/datagma-icon'
import type { BlockConfig } from '@/blocks/types'
import type { DatagmaResponse } from '@/tools/datagma/types'

export const DatagmaBlock: BlockConfig<DatagmaResponse> = {
  type: 'datagma',
  name: 'Datagma',
  description: 'Enrich people and find verified work emails with Datagma',
  longDescription:
    'Enrich a person profile from their name and company, or find a verified work email through the Datagma API. Authenticate with an API key passed as the apiId query parameter.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#1F6FEB',
  icon: DatagmaIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Enrich person', id: 'datagma_enrich_person' },
        { label: 'Find email', id: 'datagma_find_email' },
      ],
      value: () => 'datagma_enrich_person',
    },
    {
      id: 'firstName',
      title: 'First Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Jane',
      condition: { field: 'operation', value: ['datagma_enrich_person', 'datagma_find_email'] },
    },
    {
      id: 'lastName',
      title: 'Last Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Doe',
      condition: { field: 'operation', value: ['datagma_enrich_person', 'datagma_find_email'] },
    },
    {
      id: 'company',
      title: 'Company',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Acme',
      condition: { field: 'operation', value: ['datagma_enrich_person', 'datagma_find_email'] },
    },
    {
      id: 'apiKey',
      title: 'Datagma API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your Datagma API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['datagma_enrich_person', 'datagma_find_email'],
    config: {
      tool: (params) => params.operation || 'datagma_enrich_person',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Datagma API key' },
    firstName: { type: 'string', description: 'First name' },
    lastName: { type: 'string', description: 'Last name' },
    company: { type: 'string', description: 'Company name or domain' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from Datagma' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
