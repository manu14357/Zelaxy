import { GoogleBigQueryIcon } from '@/components/icons/google-bigquery-icon'
import type { BlockConfig } from '@/blocks/types'
import type { GoogleBigQueryResponse } from '@/tools/google_bigquery/types'

export const GoogleBigQueryBlock: BlockConfig<GoogleBigQueryResponse> = {
  type: 'google_bigquery',
  name: 'Google BigQuery',
  description: 'Run queries and explore datasets in Google BigQuery',
  longDescription:
    'Run SQL queries, list datasets, and list tables in Google BigQuery. Authenticate with a Google OAuth access token and a Google Cloud project ID.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#4285F4',
  icon: GoogleBigQueryIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Run query', id: 'google_bigquery_query' },
        { label: 'List datasets', id: 'google_bigquery_list_datasets' },
        { label: 'List tables', id: 'google_bigquery_list_tables' },
      ],
      value: () => 'google_bigquery_query',
    },
    {
      id: 'query',
      title: 'SQL Query',
      type: 'long-input',
      layout: 'full',
      placeholder: 'SELECT * FROM `dataset.table` LIMIT 10',
      condition: { field: 'operation', value: 'google_bigquery_query' },
    },
    {
      id: 'datasetId',
      title: 'Dataset ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'my_dataset',
      condition: { field: 'operation', value: 'google_bigquery_list_tables' },
    },
    {
      id: 'maxResults',
      title: 'Max Results',
      type: 'short-input',
      layout: 'half',
      placeholder: '50',
      condition: {
        field: 'operation',
        value: ['google_bigquery_list_datasets', 'google_bigquery_list_tables'],
      },
    },
    {
      id: 'projectId',
      title: 'Project ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'my-gcp-project',
      required: true,
    },
    {
      id: 'accessToken',
      title: 'Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Google OAuth access token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'google_bigquery_query',
      'google_bigquery_list_datasets',
      'google_bigquery_list_tables',
    ],
    config: {
      tool: (params) => params.operation || 'google_bigquery_query',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    accessToken: { type: 'string', description: 'Google OAuth access token' },
    projectId: { type: 'string', description: 'Google Cloud project ID' },
    query: { type: 'string', description: 'SQL query to execute' },
    datasetId: { type: 'string', description: 'BigQuery dataset ID' },
    maxResults: { type: 'number', description: 'Maximum number of results to return' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from BigQuery' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
