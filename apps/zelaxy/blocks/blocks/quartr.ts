import { QuartrIcon } from '@/components/icons/quartr-icon'
import type { BlockConfig } from '@/blocks/types'
import type { QuartrResponse } from '@/tools/quartr/types'

export const QuartrBlock: BlockConfig<QuartrResponse> = {
  type: 'quartr',
  name: 'Quartr',
  description: 'Access company financial data and documents from Quartr',
  longDescription:
    'Retrieve companies and list financial documents (reports, slide decks, transcripts) through the Quartr API. Authenticate with a Quartr API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#5B21B6',
  icon: QuartrIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Get company', id: 'quartr_get_company' },
        { label: 'List companies', id: 'quartr_list_companies' },
        { label: 'List documents', id: 'quartr_list_documents' },
      ],
      value: () => 'quartr_get_company',
    },
    // Get company
    {
      id: 'companyId',
      title: 'Company ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '4742',
      condition: { field: 'operation', value: 'quartr_get_company' },
    },
    // List companies
    {
      id: 'tickers',
      title: 'Tickers',
      type: 'short-input',
      layout: 'half',
      placeholder: 'AAPL,MSFT',
      condition: { field: 'operation', value: 'quartr_list_companies' },
    },
    {
      id: 'isins',
      title: 'ISINs',
      type: 'short-input',
      layout: 'half',
      placeholder: 'US0378331005',
      condition: { field: 'operation', value: 'quartr_list_companies' },
    },
    {
      id: 'countries',
      title: 'Countries',
      type: 'short-input',
      layout: 'half',
      placeholder: 'US,SE',
      condition: { field: 'operation', value: 'quartr_list_companies' },
    },
    // List documents
    {
      id: 'companyIds',
      title: 'Company IDs',
      type: 'short-input',
      layout: 'half',
      placeholder: '4742,128',
      condition: { field: 'operation', value: 'quartr_list_documents' },
    },
    {
      id: 'eventIds',
      title: 'Event IDs',
      type: 'short-input',
      layout: 'half',
      placeholder: '128301',
      condition: { field: 'operation', value: 'quartr_list_documents' },
    },
    {
      id: 'documentTypeIds',
      title: 'Document Type IDs',
      type: 'short-input',
      layout: 'half',
      placeholder: '7,10',
      condition: { field: 'operation', value: 'quartr_list_documents' },
    },
    {
      id: 'startDate',
      title: 'Start Date',
      type: 'short-input',
      layout: 'half',
      placeholder: '2024-01-01',
      condition: { field: 'operation', value: 'quartr_list_documents' },
    },
    {
      id: 'endDate',
      title: 'End Date',
      type: 'short-input',
      layout: 'half',
      placeholder: '2024-12-31',
      condition: { field: 'operation', value: 'quartr_list_documents' },
    },
    // Shared pagination for list ops
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '10',
      condition: {
        field: 'operation',
        value: ['quartr_list_companies', 'quartr_list_documents'],
      },
    },
    {
      id: 'cursor',
      title: 'Cursor',
      type: 'short-input',
      layout: 'half',
      placeholder: 'nextCursor value',
      condition: {
        field: 'operation',
        value: ['quartr_list_companies', 'quartr_list_documents'],
      },
    },
    {
      id: 'apiKey',
      title: 'Quartr API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Quartr API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['quartr_get_company', 'quartr_list_companies', 'quartr_list_documents'],
    config: {
      tool: (params) => params.operation || 'quartr_get_company',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Quartr API key' },
    companyId: { type: 'string', description: 'Quartr company ID' },
    tickers: { type: 'string', description: 'Comma-separated tickers' },
    isins: { type: 'string', description: 'Comma-separated ISINs' },
    countries: { type: 'string', description: 'Comma-separated country codes' },
    companyIds: { type: 'string', description: 'Comma-separated company IDs' },
    eventIds: { type: 'string', description: 'Comma-separated event IDs' },
    documentTypeIds: { type: 'string', description: 'Comma-separated document type IDs' },
    startDate: { type: 'string', description: 'Start date (ISO 8601)' },
    endDate: { type: 'string', description: 'End date (ISO 8601)' },
    limit: { type: 'number', description: 'Result limit' },
    cursor: { type: 'number', description: 'Pagination cursor' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Quartr' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
