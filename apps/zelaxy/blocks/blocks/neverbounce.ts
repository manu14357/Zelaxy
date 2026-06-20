import { NeverbounceIcon } from '@/components/icons/neverbounce-icon'
import type { BlockConfig } from '@/blocks/types'
import type { NeverBounceResponse } from '@/tools/neverbounce/types'

export const NeverbounceBlock: BlockConfig<NeverBounceResponse> = {
  type: 'neverbounce',
  name: 'NeverBounce',
  description: 'Verify email deliverability with NeverBounce',
  longDescription:
    'Verify the deliverability of an email address and fetch account info and remaining credits through the NeverBounce API. Authenticate with a NeverBounce API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#00C16E',
  icon: NeverbounceIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Verify email', id: 'neverbounce_verify_email' },
        { label: 'Get account', id: 'neverbounce_get_account' },
      ],
      value: () => 'neverbounce_verify_email',
    },
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'full',
      placeholder: 'john@example.com',
      condition: { field: 'operation', value: 'neverbounce_verify_email' },
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your NeverBounce API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['neverbounce_verify_email', 'neverbounce_get_account'],
    config: {
      tool: (params) => params.operation || 'neverbounce_verify_email',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'NeverBounce API key' },
    email: { type: 'string', description: 'Email address to verify' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from NeverBounce' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
