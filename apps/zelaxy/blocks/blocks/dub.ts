import { ConnectIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const DubBlock: BlockConfig = {
  type: 'dub',
  name: 'Dub',
  description: 'Create and manage short links in Dub.co',
  longDescription:
    'Integrate Dub.co link management into your workflows. Create, update, retrieve, and delete short links, plus access analytics data.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#181C1E',
  icon: ConnectIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Create Link', id: 'dub_create_link' },
        { label: 'Get Link', id: 'dub_get_link' },
        { label: 'Update Link', id: 'dub_update_link' },
        { label: 'Delete Link', id: 'dub_delete_link' },
        { label: 'List Links', id: 'dub_list_links' },
        { label: 'Get Analytics', id: 'dub_get_analytics' },
      ],
      required: true,
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      password: true,
      placeholder: 'Your Dub API key',
      required: true,
    },
    {
      id: 'url',
      title: 'Destination URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://example.com/long-url',
      condition: { field: 'operation', value: ['dub_create_link', 'dub_update_link'] },
    },
    {
      id: 'domain',
      title: 'Domain',
      type: 'short-input',
      layout: 'half',
      placeholder: 'dub.sh',
      condition: { field: 'operation', value: ['dub_create_link', 'dub_get_link'] },
    },
    {
      id: 'key',
      title: 'Key (slug)',
      type: 'short-input',
      layout: 'half',
      placeholder: 'my-link',
      condition: {
        field: 'operation',
        value: ['dub_create_link', 'dub_get_link', 'dub_update_link', 'dub_delete_link'],
      },
    },
  ],
  tools: {
    access: [
      'dub_create_link',
      'dub_get_link',
      'dub_update_link',
      'dub_delete_link',
      'dub_list_links',
      'dub_get_analytics',
    ],
    config: {
      tool: (params) => params.operation || 'dub_create_link',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'API key' },
    url: { type: 'string', description: 'Destination URL' },
    domain: { type: 'string', description: 'Link domain' },
    key: { type: 'string', description: 'Link key/slug' },
  },
  outputs: {
    shortLink: { type: 'string', description: 'Short link URL' },
    clicks: { type: 'number', description: 'Click count' },
    links: { type: 'json', description: 'Link list' },
  },
}
