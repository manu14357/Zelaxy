import { KetchIcon } from '@/components/icons/ketch-icon'
import type { BlockConfig } from '@/blocks/types'
import type { KetchResponse } from '@/tools/ketch/types'

export const KetchBlock: BlockConfig<KetchResponse> = {
  type: 'ketch',
  name: 'Ketch',
  description: 'Manage consent and privacy rights in Ketch',
  longDescription:
    'Retrieve and update data-subject consent preferences and submit privacy rights requests through the Ketch API. Requests are addressed by organization, property, and environment codes.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#1A1A2E',
  icon: KetchIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Get consent', id: 'ketch_get_consent' },
        { label: 'Set consent', id: 'ketch_set_consent' },
        { label: 'Invoke right', id: 'ketch_invoke_right' },
      ],
      value: () => 'ketch_get_consent',
    },
    {
      id: 'organizationCode',
      title: 'Organization Code',
      type: 'short-input',
      layout: 'half',
      placeholder: 'acme',
      required: true,
    },
    {
      id: 'propertyCode',
      title: 'Property Code',
      type: 'short-input',
      layout: 'half',
      placeholder: 'website',
      required: true,
    },
    {
      id: 'environmentCode',
      title: 'Environment Code',
      type: 'short-input',
      layout: 'half',
      placeholder: 'production',
      required: true,
    },
    {
      id: 'jurisdictionCode',
      title: 'Jurisdiction Code',
      type: 'short-input',
      layout: 'half',
      placeholder: 'gdpr',
      condition: {
        field: 'operation',
        value: ['ketch_get_consent', 'ketch_set_consent', 'ketch_invoke_right'],
      },
    },
    {
      id: 'identities',
      title: 'Identities',
      type: 'long-input',
      layout: 'full',
      placeholder: '{"email": "user@example.com"}',
      required: true,
    },
    // Get consent
    {
      id: 'purposes',
      title: 'Purposes',
      type: 'long-input',
      layout: 'full',
      placeholder: '{"analytics": {"allowed": "granted", "legalBasisCode": "consent_optin"}}',
      condition: { field: 'operation', value: ['ketch_get_consent', 'ketch_set_consent'] },
    },
    // Set consent
    {
      id: 'collectedAt',
      title: 'Collected At (UNIX timestamp)',
      type: 'short-input',
      layout: 'half',
      placeholder: '1700000000',
      condition: { field: 'operation', value: 'ketch_set_consent' },
    },
    // Invoke right
    {
      id: 'rightCode',
      title: 'Right Code',
      type: 'short-input',
      layout: 'half',
      placeholder: 'access',
      condition: { field: 'operation', value: 'ketch_invoke_right' },
    },
    {
      id: 'userData',
      title: 'User Data',
      type: 'long-input',
      layout: 'full',
      placeholder: '{"email": "user@example.com", "firstName": "John", "lastName": "Doe"}',
      condition: { field: 'operation', value: 'ketch_invoke_right' },
    },
  ],
  tools: {
    access: ['ketch_get_consent', 'ketch_set_consent', 'ketch_invoke_right'],
    config: {
      tool: (params) => params.operation || 'ketch_get_consent',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    organizationCode: { type: 'string', description: 'Ketch organization code' },
    propertyCode: { type: 'string', description: 'Digital property code' },
    environmentCode: { type: 'string', description: 'Environment code' },
    jurisdictionCode: { type: 'string', description: 'Jurisdiction code' },
    identities: { type: 'json', description: 'Identity map' },
    purposes: { type: 'json', description: 'Consent purposes map' },
    collectedAt: { type: 'number', description: 'Consent collection timestamp' },
    rightCode: { type: 'string', description: 'Privacy right code' },
    userData: { type: 'json', description: 'Data subject information' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from Ketch' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
