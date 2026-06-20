import { PeopleDataLabsIcon } from '@/components/icons/peopledatalabs-icon'
import type { BlockConfig } from '@/blocks/types'
import type { PeopleDataLabsResponse } from '@/tools/peopledatalabs/types'

export const PeopleDataLabsBlock: BlockConfig<PeopleDataLabsResponse> = {
  type: 'peopledatalabs',
  name: 'People Data Labs',
  description: 'Enrich and search people and company data with People Data Labs',
  longDescription:
    'Enrich a single person or company by email, name, website, or ticker, or search the person dataset using a query or SQL through the People Data Labs API. Authenticate with an API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#6C5CE7',
  icon: PeopleDataLabsIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Enrich person', id: 'peopledatalabs_person_enrich' },
        { label: 'Enrich company', id: 'peopledatalabs_company_enrich' },
        { label: 'Search person', id: 'peopledatalabs_person_search' },
      ],
      value: () => 'peopledatalabs_person_enrich',
    },
    // Person enrich
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'half',
      placeholder: 'jane@example.com',
      condition: { field: 'operation', value: 'peopledatalabs_person_enrich' },
    },
    {
      id: 'name',
      title: 'Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Jane Doe',
      condition: {
        field: 'operation',
        value: ['peopledatalabs_person_enrich', 'peopledatalabs_company_enrich'],
      },
    },
    {
      id: 'company',
      title: 'Company',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Acme',
      condition: { field: 'operation', value: 'peopledatalabs_person_enrich' },
    },
    {
      id: 'min_likelihood',
      title: 'Min Likelihood',
      type: 'short-input',
      layout: 'half',
      placeholder: '6',
      condition: { field: 'operation', value: 'peopledatalabs_person_enrich' },
    },
    // Company enrich
    {
      id: 'website',
      title: 'Website',
      type: 'short-input',
      layout: 'half',
      placeholder: 'acme.com',
      condition: { field: 'operation', value: 'peopledatalabs_company_enrich' },
    },
    {
      id: 'ticker',
      title: 'Ticker',
      type: 'short-input',
      layout: 'half',
      placeholder: 'ACME',
      condition: { field: 'operation', value: 'peopledatalabs_company_enrich' },
    },
    // Person search
    {
      id: 'query',
      title: 'Query',
      type: 'long-input',
      layout: 'full',
      placeholder: '{"term":{"job_title_role":"engineering"}}',
      condition: { field: 'operation', value: 'peopledatalabs_person_search' },
    },
    {
      id: 'sql',
      title: 'SQL',
      type: 'long-input',
      layout: 'full',
      placeholder: "SELECT * FROM person WHERE job_title='engineer'",
      condition: { field: 'operation', value: 'peopledatalabs_person_search' },
    },
    {
      id: 'size',
      title: 'Size',
      type: 'short-input',
      layout: 'half',
      placeholder: '10',
      condition: { field: 'operation', value: 'peopledatalabs_person_search' },
    },
    {
      id: 'apiKey',
      title: 'People Data Labs API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your People Data Labs API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'peopledatalabs_person_enrich',
      'peopledatalabs_company_enrich',
      'peopledatalabs_person_search',
    ],
    config: {
      tool: (params) => params.operation || 'peopledatalabs_person_enrich',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'People Data Labs API key' },
    email: { type: 'string', description: 'Email address' },
    name: { type: 'string', description: 'Person or company name' },
    company: { type: 'string', description: 'Company name or website' },
    min_likelihood: { type: 'number', description: 'Minimum match likelihood' },
    website: { type: 'string', description: 'Company website domain' },
    ticker: { type: 'string', description: 'Stock ticker symbol' },
    query: { type: 'json', description: 'Elasticsearch DSL query object' },
    sql: { type: 'string', description: 'PDL SQL query string' },
    size: { type: 'number', description: 'Number of results to return' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from People Data Labs' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
