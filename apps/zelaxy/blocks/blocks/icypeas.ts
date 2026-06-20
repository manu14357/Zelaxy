import { IcypeasIcon } from '@/components/icons/icypeas-icon'
import type { BlockConfig } from '@/blocks/types'
import type { IcypeasResponse } from '@/tools/icypeas/types'

export const IcypeasBlock: BlockConfig<IcypeasResponse> = {
  type: 'icypeas',
  name: 'Icypeas',
  description: 'Find and verify professional email addresses',
  longDescription:
    'Find professional email addresses from a name and company, verify email deliverability, and discover emails for a company domain through the Icypeas API. Authenticate with an Icypeas API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#00B8D9',
  icon: IcypeasIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Email search', id: 'icypeas_email_search' },
        { label: 'Email verification', id: 'icypeas_email_verification' },
        { label: 'Domain search', id: 'icypeas_domain_search' },
      ],
      value: () => 'icypeas_email_search',
    },
    // Email search
    {
      id: 'firstname',
      title: 'First Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'John',
      condition: { field: 'operation', value: 'icypeas_email_search' },
    },
    {
      id: 'lastname',
      title: 'Last Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Doe',
      condition: { field: 'operation', value: 'icypeas_email_search' },
    },
    {
      id: 'domainOrCompany',
      title: 'Domain or Company',
      type: 'short-input',
      layout: 'full',
      placeholder: 'stripe.com or Stripe',
      condition: { field: 'operation', value: 'icypeas_email_search' },
    },
    // Email verification
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'full',
      placeholder: 'john@stripe.com',
      condition: { field: 'operation', value: 'icypeas_email_verification' },
    },
    // Domain search
    {
      id: 'domain',
      title: 'Domain',
      type: 'short-input',
      layout: 'full',
      placeholder: 'stripe.com',
      condition: { field: 'operation', value: 'icypeas_domain_search' },
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Icypeas API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['icypeas_email_search', 'icypeas_email_verification', 'icypeas_domain_search'],
    config: {
      tool: (params) => params.operation || 'icypeas_email_search',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Icypeas API key' },
    firstname: { type: 'string', description: 'Target first name' },
    lastname: { type: 'string', description: 'Target last name' },
    domainOrCompany: { type: 'string', description: 'Company domain or name' },
    email: { type: 'string', description: 'Email address to verify' },
    domain: { type: 'string', description: 'Company domain to search' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from Icypeas' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
