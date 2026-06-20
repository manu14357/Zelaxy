import { DropcontactIcon } from '@/components/icons/dropcontact-icon'
import type { BlockConfig } from '@/blocks/types'
import type { DropcontactResponse } from '@/tools/dropcontact/types'

export const DropcontactBlock: BlockConfig<DropcontactResponse> = {
  type: 'dropcontact',
  name: 'Dropcontact',
  description: 'Enrich B2B contacts with verified emails and company data',
  longDescription:
    'Submit contacts for B2B enrichment and retrieve verified emails, phone numbers, and company data from Dropcontact. Enrichment is asynchronous: submit with Enrich, then poll the result with Get Batch using the returned request ID. Authenticate with a Dropcontact API access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#4A90D9',
  icon: DropcontactIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Enrich contact', id: 'dropcontact_enrich' },
        { label: 'Get batch result', id: 'dropcontact_get_batch' },
      ],
      value: () => 'dropcontact_enrich',
    },
    // Enrich
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'half',
      placeholder: 'contact@example.com',
      condition: { field: 'operation', value: 'dropcontact_enrich' },
    },
    {
      id: 'first_name',
      title: 'First Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Jane',
      condition: { field: 'operation', value: 'dropcontact_enrich' },
    },
    {
      id: 'last_name',
      title: 'Last Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Doe',
      condition: { field: 'operation', value: 'dropcontact_enrich' },
    },
    {
      id: 'company',
      title: 'Company',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Acme Inc',
      condition: { field: 'operation', value: 'dropcontact_enrich' },
    },
    // Get batch
    {
      id: 'request_id',
      title: 'Request ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Request ID from the enrich operation',
      condition: { field: 'operation', value: 'dropcontact_get_batch' },
    },
    {
      id: 'apiKey',
      title: 'API Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Dropcontact access token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['dropcontact_enrich', 'dropcontact_get_batch'],
    config: {
      tool: (params) => params.operation || 'dropcontact_enrich',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Dropcontact API access token' },
    email: { type: 'string', description: 'Contact email' },
    first_name: { type: 'string', description: 'Contact first name' },
    last_name: { type: 'string', description: 'Contact last name' },
    company: { type: 'string', description: 'Contact company' },
    request_id: { type: 'string', description: 'Enrichment request ID' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Dropcontact' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
