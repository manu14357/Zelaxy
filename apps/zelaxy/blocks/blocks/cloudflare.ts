import { AtomIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const CloudflareBlock: BlockConfig = {
  type: 'cloudflare',
  name: 'Cloudflare',
  description: 'Manage zones, DNS records, and caching in Cloudflare',
  longDescription:
    'Integrate Cloudflare into your workflows. List zones, manage DNS records, configure zone settings, and purge caches.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#F48120',
  icon: AtomIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List Zones', id: 'cloudflare_list_zones' },
        { label: 'Get Zone', id: 'cloudflare_get_zone' },
        { label: 'List DNS Records', id: 'cloudflare_list_dns_records' },
        { label: 'Create DNS Record', id: 'cloudflare_create_dns_record' },
        { label: 'Update DNS Record', id: 'cloudflare_update_dns_record' },
        { label: 'Delete DNS Record', id: 'cloudflare_delete_dns_record' },
        { label: 'Purge Cache', id: 'cloudflare_purge_cache' },
      ],
      required: true,
    },
    {
      id: 'apiToken',
      title: 'API Token',
      type: 'short-input',
      layout: 'full',
      password: true,
      placeholder: 'Your Cloudflare API token',
      required: true,
    },
    {
      id: 'name',
      title: 'Zone/Record Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'example.com',
      condition: {
        field: 'operation',
        value: ['cloudflare_list_zones', 'cloudflare_create_dns_record'],
      },
    },
    {
      id: 'zoneId',
      title: 'Zone ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'zone-id',
      condition: {
        field: 'operation',
        value: [
          'cloudflare_get_zone',
          'cloudflare_list_dns_records',
          'cloudflare_create_dns_record',
          'cloudflare_purge_cache',
        ],
      },
    },
    {
      id: 'recordId',
      title: 'Record ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'record-id',
      condition: {
        field: 'operation',
        value: ['cloudflare_update_dns_record', 'cloudflare_delete_dns_record'],
      },
    },
    {
      id: 'recordType',
      title: 'Record Type',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'A', id: 'A' },
        { label: 'CNAME', id: 'CNAME' },
        { label: 'MX', id: 'MX' },
        { label: 'TXT', id: 'TXT' },
      ],
      condition: {
        field: 'operation',
        value: ['cloudflare_create_dns_record', 'cloudflare_update_dns_record'],
      },
    },
    {
      id: 'recordContent',
      title: 'Record Content',
      type: 'short-input',
      layout: 'half',
      placeholder: '1.2.3.4',
      condition: {
        field: 'operation',
        value: ['cloudflare_create_dns_record', 'cloudflare_update_dns_record'],
      },
    },
  ],
  tools: {
    access: [
      'cloudflare_list_zones',
      'cloudflare_get_zone',
      'cloudflare_list_dns_records',
      'cloudflare_create_dns_record',
      'cloudflare_update_dns_record',
      'cloudflare_delete_dns_record',
      'cloudflare_purge_cache',
    ],
    config: {
      tool: (params) => params.operation || 'cloudflare_list_zones',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiToken: { type: 'string', description: 'API token' },
    name: { type: 'string', description: 'Zone or record name' },
    zoneId: { type: 'string', description: 'Zone ID' },
    recordId: { type: 'string', description: 'Record ID' },
    recordType: { type: 'string', description: 'DNS record type' },
    recordContent: { type: 'string', description: 'Record content' },
  },
  outputs: {
    zones: { type: 'json', description: 'Zone list' },
    dnsRecords: { type: 'json', description: 'DNS records' },
  },
}
