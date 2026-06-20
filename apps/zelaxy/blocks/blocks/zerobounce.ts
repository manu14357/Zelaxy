import { ZeroBounceIcon } from '@/components/icons/zerobounce-icon'
import type { BlockConfig } from '@/blocks/types'
import type { ZeroBounceResponse } from '@/tools/zerobounce/types'

export const ZeroBounceBlock: BlockConfig<ZeroBounceResponse> = {
  type: 'zerobounce',
  name: 'ZeroBounce',
  description: 'Validate email deliverability with ZeroBounce',
  longDescription:
    'Validate the deliverability of an email address in real time and check remaining account credits through the ZeroBounce API. Authenticate with a ZeroBounce API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#FF6B35',
  icon: ZeroBounceIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Validate email', id: 'zerobounce_validate_email' },
        { label: 'Get credits', id: 'zerobounce_get_credits' },
      ],
      value: () => 'zerobounce_validate_email',
    },
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'full',
      placeholder: 'john@example.com',
      condition: { field: 'operation', value: 'zerobounce_validate_email' },
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your ZeroBounce API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['zerobounce_validate_email', 'zerobounce_get_credits'],
    config: {
      tool: (params) => params.operation || 'zerobounce_validate_email',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'ZeroBounce API key' },
    email: { type: 'string', description: 'Email address to validate' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from ZeroBounce' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
