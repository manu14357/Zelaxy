import { MillionVerifierIcon } from '@/components/icons/millionverifier-icon'
import type { BlockConfig } from '@/blocks/types'
import type { MillionVerifierResponse } from '@/tools/millionverifier/types'

export const MillionVerifierBlock: BlockConfig<MillionVerifierResponse> = {
  type: 'millionverifier',
  name: 'MillionVerifier',
  description: 'Verify email deliverability with MillionVerifier',
  longDescription:
    'Verify the deliverability of an email address and check remaining account credits through the MillionVerifier API. Authenticate with a MillionVerifier API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#0EA5E9',
  icon: MillionVerifierIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Verify email', id: 'millionverifier_verify_email' },
        { label: 'Get credits', id: 'millionverifier_get_credits' },
      ],
      value: () => 'millionverifier_verify_email',
    },
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'full',
      placeholder: 'john@example.com',
      condition: { field: 'operation', value: 'millionverifier_verify_email' },
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your MillionVerifier API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['millionverifier_verify_email', 'millionverifier_get_credits'],
    config: {
      tool: (params) => params.operation || 'millionverifier_verify_email',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'MillionVerifier API key' },
    email: { type: 'string', description: 'Email address to verify' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from MillionVerifier' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
