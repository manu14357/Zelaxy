import { EnrowIcon } from '@/components/icons/enrow-icon'
import type { BlockConfig } from '@/blocks/types'
import type { EnrowResponse } from '@/tools/enrow/types'

export const EnrowBlock: BlockConfig<EnrowResponse> = {
  type: 'enrow',
  name: 'Enrow',
  description: 'Find and verify B2B email addresses',
  longDescription:
    'Find verified B2B email addresses from a name and company, verify email deliverability, and retrieve the result of an async find job through the Enrow API. Authenticate with an Enrow API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#5E35B1',
  icon: EnrowIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Find email', id: 'enrow_find_email' },
        { label: 'Verify email', id: 'enrow_verify_email' },
        { label: 'Get result', id: 'enrow_get_result' },
      ],
      value: () => 'enrow_find_email',
    },
    // Find email
    {
      id: 'fullname',
      title: 'Full Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'John Doe',
      condition: { field: 'operation', value: 'enrow_find_email' },
    },
    {
      id: 'company',
      title: 'Company',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Apple or apple.com',
      condition: { field: 'operation', value: 'enrow_find_email' },
    },
    // Verify email
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'full',
      placeholder: 'john@example.com',
      condition: { field: 'operation', value: 'enrow_verify_email' },
    },
    // Get result
    {
      id: 'id',
      title: 'Job ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Job ID from the find-email operation',
      condition: { field: 'operation', value: 'enrow_get_result' },
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Enrow API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['enrow_find_email', 'enrow_verify_email', 'enrow_get_result'],
    config: {
      tool: (params) => params.operation || 'enrow_find_email',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Enrow API key' },
    fullname: { type: 'string', description: 'Full name of the person' },
    company: { type: 'string', description: 'Company name or domain' },
    email: { type: 'string', description: 'Email address to verify' },
    id: { type: 'string', description: 'Find-email job ID' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from Enrow' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
