import { ProspeoIcon } from '@/components/icons/prospeo-icon'
import type { BlockConfig } from '@/blocks/types'
import type { ProspeoResponse } from '@/tools/prospeo/types'

export const ProspeoBlock: BlockConfig<ProspeoResponse> = {
  type: 'prospeo',
  name: 'Prospeo',
  description: 'Find verified emails and mobile numbers',
  longDescription:
    'Find verified professional emails from a name and company or a LinkedIn URL, and reveal mobile numbers from a LinkedIn profile using the Prospeo API. Authenticate with a Prospeo API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#FF5C35',
  icon: ProspeoIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Email finder', id: 'prospeo_email_finder' },
        { label: 'Mobile finder', id: 'prospeo_mobile_finder' },
        { label: 'LinkedIn email finder', id: 'prospeo_linkedin_email_finder' },
      ],
      value: () => 'prospeo_email_finder',
    },
    // Email finder
    {
      id: 'first_name',
      title: 'First Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Jane',
      required: true,
      condition: { field: 'operation', value: 'prospeo_email_finder' },
    },
    {
      id: 'last_name',
      title: 'Last Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Doe',
      required: true,
      condition: { field: 'operation', value: 'prospeo_email_finder' },
    },
    {
      id: 'company',
      title: 'Company',
      type: 'short-input',
      layout: 'full',
      placeholder: 'acme.com',
      required: true,
      condition: { field: 'operation', value: 'prospeo_email_finder' },
    },
    // Mobile finder + LinkedIn email finder
    {
      id: 'url',
      title: 'LinkedIn URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://www.linkedin.com/in/janedoe',
      required: true,
      condition: {
        field: 'operation',
        value: ['prospeo_mobile_finder', 'prospeo_linkedin_email_finder'],
      },
    },
    {
      id: 'apiKey',
      title: 'Prospeo API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your Prospeo API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['prospeo_email_finder', 'prospeo_mobile_finder', 'prospeo_linkedin_email_finder'],
    config: {
      tool: (params) => params.operation || 'prospeo_email_finder',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Prospeo API key' },
    first_name: { type: 'string', description: 'First name' },
    last_name: { type: 'string', description: 'Last name' },
    company: { type: 'string', description: 'Company name or domain' },
    url: { type: 'string', description: 'LinkedIn profile URL' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from Prospeo' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
