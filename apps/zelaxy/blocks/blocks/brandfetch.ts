import { ImageIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const BrandfetchBlock: BlockConfig = {
  type: 'brandfetch',
  name: 'Brandfetch',
  description: 'Retrieve brand assets, logos, and colors from Brandfetch',
  longDescription:
    'Integrate Brandfetch brand intelligence into your workflows. Get logos, colors, typography, and company data for any brand by domain.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#000000',
  icon: ImageIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Get Brand', id: 'brandfetch_get_brand' },
        { label: 'Search Brands', id: 'brandfetch_search' },
      ],
      required: true,
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      password: true,
      placeholder: 'Your Brandfetch API key',
      required: true,
    },
    {
      id: 'identifier',
      title: 'Domain',
      type: 'short-input',
      layout: 'full',
      placeholder: 'example.com',
      condition: { field: 'operation', value: ['brandfetch_get_brand'] },
    },
    {
      id: 'name',
      title: 'Brand Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Apple',
      condition: { field: 'operation', value: ['brandfetch_search'] },
    },
  ],
  tools: {
    access: ['brandfetch_get_brand', 'brandfetch_search'],
    config: {
      tool: (params) => params.operation || 'brandfetch_get_brand',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'API key' },
    identifier: { type: 'string', description: 'Brand domain' },
    name: { type: 'string', description: 'Brand name to search' },
  },
  outputs: {
    id: { type: 'string', description: 'Brand ID' },
    name: { type: 'string', description: 'Brand name' },
    domain: { type: 'string', description: 'Brand domain' },
    logos: { type: 'json', description: 'Logo assets' },
    colors: { type: 'json', description: 'Brand colors' },
    company: { type: 'json', description: 'Company info' },
  },
}
