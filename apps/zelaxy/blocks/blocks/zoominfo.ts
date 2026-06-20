import { ZoomInfoIcon } from '@/components/icons/zoominfo-icon'
import type { BlockConfig } from '@/blocks/types'
import type { ZoomInfoResponse } from '@/tools/zoominfo/types'

export const ZoomInfoBlock: BlockConfig<ZoomInfoResponse> = {
  type: 'zoominfo',
  name: 'ZoomInfo',
  description: 'Enrich and search contacts and companies with ZoomInfo',
  longDescription:
    'Enrich contacts and companies with verified emails, phone numbers, firmographics, and job details, or search for contacts by name, title, and company through the ZoomInfo API. Authenticate with a Bearer token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#E22E20',
  icon: ZoomInfoIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Enrich contact', id: 'zoominfo_enrich_contact' },
        { label: 'Enrich company', id: 'zoominfo_enrich_company' },
        { label: 'Search contact', id: 'zoominfo_search_contact' },
      ],
      value: () => 'zoominfo_enrich_contact',
    },
    // Enrich contact
    {
      id: 'matchPersonInput',
      title: 'Match Person Input',
      type: 'long-input',
      layout: 'full',
      placeholder: '[{"firstName":"Jane","lastName":"Doe","companyName":"Acme"}]',
      condition: { field: 'operation', value: 'zoominfo_enrich_contact' },
    },
    // Enrich company
    {
      id: 'matchCompanyInput',
      title: 'Match Company Input',
      type: 'long-input',
      layout: 'full',
      placeholder: '[{"companyName":"Acme","companyWebsite":"acme.com"}]',
      condition: { field: 'operation', value: 'zoominfo_enrich_company' },
    },
    {
      id: 'outputFields',
      title: 'Output Fields',
      type: 'long-input',
      layout: 'full',
      placeholder: '["email","phone","jobTitle"]',
      condition: {
        field: 'operation',
        value: ['zoominfo_enrich_contact', 'zoominfo_enrich_company'],
      },
    },
    // Search contact
    {
      id: 'firstName',
      title: 'First Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Jane',
      condition: { field: 'operation', value: 'zoominfo_search_contact' },
    },
    {
      id: 'lastName',
      title: 'Last Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Doe',
      condition: { field: 'operation', value: 'zoominfo_search_contact' },
    },
    {
      id: 'jobTitle',
      title: 'Job Title',
      type: 'short-input',
      layout: 'half',
      placeholder: 'VP of Sales',
      condition: { field: 'operation', value: 'zoominfo_search_contact' },
    },
    {
      id: 'companyName',
      title: 'Company Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Acme',
      condition: { field: 'operation', value: 'zoominfo_search_contact' },
    },
    {
      id: 'rpp',
      title: 'Results Per Page',
      type: 'short-input',
      layout: 'half',
      placeholder: '25',
      condition: { field: 'operation', value: 'zoominfo_search_contact' },
    },
    {
      id: 'apiKey',
      title: 'ZoomInfo Bearer Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your ZoomInfo Bearer token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['zoominfo_enrich_contact', 'zoominfo_enrich_company', 'zoominfo_search_contact'],
    config: {
      tool: (params) => params.operation || 'zoominfo_enrich_contact',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'ZoomInfo Bearer token' },
    matchPersonInput: { type: 'json', description: 'Array of contact match criteria' },
    matchCompanyInput: { type: 'json', description: 'Array of company match criteria' },
    outputFields: { type: 'json', description: 'Array of fields to return' },
    firstName: { type: 'string', description: 'First name' },
    lastName: { type: 'string', description: 'Last name' },
    jobTitle: { type: 'string', description: 'Job title' },
    companyName: { type: 'string', description: 'Company name' },
    rpp: { type: 'number', description: 'Results per page' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from ZoomInfo' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
