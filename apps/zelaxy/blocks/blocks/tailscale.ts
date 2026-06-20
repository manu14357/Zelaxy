import { TailscaleIcon } from '@/components/icons/tailscale-icon'
import type { BlockConfig } from '@/blocks/types'
import type { TailscaleResponse } from '@/tools/tailscale/types'

export const TailscaleBlock: BlockConfig<TailscaleResponse> = {
  type: 'tailscale',
  name: 'Tailscale',
  description: 'List devices and keys in a Tailscale tailnet',
  longDescription:
    'List the devices and auth keys in a Tailscale tailnet and fetch individual device details through the Tailscale API. Authenticate with an API access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#242424',
  icon: TailscaleIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List devices', id: 'tailscale_list_devices' },
        { label: 'Get device', id: 'tailscale_get_device' },
        { label: 'List keys', id: 'tailscale_list_keys' },
      ],
      value: () => 'tailscale_list_devices',
    },
    {
      id: 'tailnet',
      title: 'Tailnet',
      type: 'short-input',
      layout: 'full',
      placeholder: '- (default tailnet)',
      condition: { field: 'operation', value: ['tailscale_list_devices', 'tailscale_list_keys'] },
    },
    {
      id: 'deviceId',
      title: 'Device ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'nodekey:...',
      condition: { field: 'operation', value: 'tailscale_get_device' },
    },
    {
      id: 'apiKey',
      title: 'API Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'tskey-api-...',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['tailscale_list_devices', 'tailscale_get_device', 'tailscale_list_keys'],
    config: {
      tool: (params) => params.operation || 'tailscale_list_devices',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Tailscale API access token' },
    tailnet: { type: 'string', description: 'Tailnet name' },
    deviceId: { type: 'string', description: 'Device ID' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Tailscale' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
