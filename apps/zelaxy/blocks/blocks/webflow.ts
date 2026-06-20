import { WebflowIcon } from '@/components/icons/webflow-icon'
import type { BlockConfig } from '@/blocks/types'
import type { WebflowResponse } from '@/tools/webflow/types'

export const WebflowBlock: BlockConfig<WebflowResponse> = {
  type: 'webflow',
  name: 'Webflow',
  description: 'Manage sites, collections, and CMS items in Webflow',
  longDescription:
    'List sites and collections, and list and create CMS collection items through the Webflow API. Authenticate with a Webflow API token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#4353FF',
  icon: WebflowIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List sites', id: 'webflow_list_sites' },
        { label: 'List collections', id: 'webflow_list_collections' },
        { label: 'List collection items', id: 'webflow_list_collection_items' },
        { label: 'Create collection item', id: 'webflow_create_collection_item' },
      ],
      value: () => 'webflow_list_sites',
    },
    // List collections
    {
      id: 'site_id',
      title: 'Site ID',
      type: 'short-input',
      layout: 'full',
      placeholder: '580e63e98c9a982ac9b8b741',
      condition: { field: 'operation', value: 'webflow_list_collections' },
    },
    // Collection items
    {
      id: 'collection_id',
      title: 'Collection ID',
      type: 'short-input',
      layout: 'full',
      placeholder: '580e63fc8c9a982ac9b8b745',
      condition: {
        field: 'operation',
        value: ['webflow_list_collection_items', 'webflow_create_collection_item'],
      },
    },
    {
      id: 'fieldData',
      title: 'Field Data',
      type: 'long-input',
      layout: 'full',
      placeholder: '{ "name": "My Item", "slug": "my-item" }',
      condition: { field: 'operation', value: 'webflow_create_collection_item' },
    },
    {
      id: 'apiKey',
      title: 'API Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Bearer token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'webflow_list_sites',
      'webflow_list_collections',
      'webflow_list_collection_items',
      'webflow_create_collection_item',
    ],
    config: {
      tool: (params) => params.operation || 'webflow_list_sites',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Webflow API token' },
    site_id: { type: 'string', description: 'Webflow site ID' },
    collection_id: { type: 'string', description: 'Webflow collection ID' },
    fieldData: { type: 'json', description: 'Field data for the new item' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Webflow' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
