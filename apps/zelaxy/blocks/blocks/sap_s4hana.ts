import { SapS4HanaIcon } from '@/components/icons/sap-s4hana-icon'
import type { BlockConfig } from '@/blocks/types'
import type { SapS4HanaResponse } from '@/tools/sap_s4hana/types'

export const SapS4HanaBlock: BlockConfig<SapS4HanaResponse> = {
  type: 'sap_s4hana',
  name: 'SAP S/4HANA',
  description: 'Query business partners and products from SAP S/4HANA',
  longDescription:
    'Read business partners and products from an SAP S/4HANA system via its OData v2 APIs (API_BUSINESS_PARTNER, API_PRODUCT_SRV). Authenticate with HTTP Basic credentials against your S/4HANA host.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#0FAAFF',
  icon: SapS4HanaIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Get business partners', id: 'sap_s4hana_get_business_partners' },
        { label: 'Get business partner', id: 'sap_s4hana_get_business_partner' },
        { label: 'List products', id: 'sap_s4hana_list_products' },
      ],
      value: () => 'sap_s4hana_get_business_partners',
    },
    // Get business partner (single)
    {
      id: 'businessPartner',
      title: 'Business Partner Key',
      type: 'short-input',
      layout: 'full',
      placeholder: '1000000',
      condition: { field: 'operation', value: 'sap_s4hana_get_business_partner' },
    },
    // List operations
    {
      id: 'filter',
      title: 'OData $filter',
      type: 'short-input',
      layout: 'full',
      placeholder: "BusinessPartnerCategory eq '1'",
      condition: {
        field: 'operation',
        value: ['sap_s4hana_get_business_partners', 'sap_s4hana_list_products'],
      },
    },
    {
      id: 'top',
      title: 'Top',
      type: 'short-input',
      layout: 'half',
      placeholder: '10',
      condition: {
        field: 'operation',
        value: ['sap_s4hana_get_business_partners', 'sap_s4hana_list_products'],
      },
    },
    {
      id: 'skip',
      title: 'Skip',
      type: 'short-input',
      layout: 'half',
      placeholder: '0',
      condition: {
        field: 'operation',
        value: ['sap_s4hana_get_business_partners', 'sap_s4hana_list_products'],
      },
    },
    {
      id: 'select',
      title: 'OData $select',
      type: 'short-input',
      layout: 'full',
      placeholder: 'BusinessPartner,BusinessPartnerName',
      condition: {
        field: 'operation',
        value: [
          'sap_s4hana_get_business_partners',
          'sap_s4hana_get_business_partner',
          'sap_s4hana_list_products',
        ],
      },
    },
    // Connection / auth
    {
      id: 'baseUrl',
      title: 'Base URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://my000000.s4hana.cloud.sap',
      required: true,
    },
    {
      id: 'username',
      title: 'Username',
      type: 'short-input',
      layout: 'half',
      required: true,
    },
    {
      id: 'password',
      title: 'Password',
      type: 'short-input',
      layout: 'half',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'sap_s4hana_get_business_partners',
      'sap_s4hana_get_business_partner',
      'sap_s4hana_list_products',
    ],
    config: {
      tool: (params) => params.operation || 'sap_s4hana_get_business_partners',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    baseUrl: { type: 'string', description: 'S/4HANA host base URL' },
    username: { type: 'string', description: 'Basic auth username' },
    password: { type: 'string', description: 'Basic auth password' },
    businessPartner: { type: 'string', description: 'BusinessPartner key' },
    filter: { type: 'string', description: 'OData $filter expression' },
    top: { type: 'number', description: 'OData $top' },
    skip: { type: 'number', description: 'OData $skip' },
    select: { type: 'string', description: 'OData $select fields' },
  },
  outputs: {
    data: { type: 'json', description: 'OData result from SAP S/4HANA' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
