import { DatabaseIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const DatabricksBlock: BlockConfig = {
  type: 'databricks',
  name: 'Databricks',
  description: 'Execute queries and manage jobs in Databricks',
  longDescription:
    'Integrate Databricks into your workflows. Execute SQL queries, manage job runs, list clusters, and interact with the Databricks platform.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#FF3621',
  icon: DatabaseIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Execute SQL', id: 'databricks_execute_sql' },
        { label: 'List Clusters', id: 'databricks_list_clusters' },
        { label: 'List Jobs', id: 'databricks_list_jobs' },
        { label: 'Run Job', id: 'databricks_run_job' },
        { label: 'Get Run Status', id: 'databricks_get_run_status' },
        { label: 'List Catalogs', id: 'databricks_list_catalogs' },
      ],
      required: true,
    },
    {
      id: 'host',
      title: 'Workspace URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://your-workspace.azuredatabricks.net',
      required: true,
    },
    {
      id: 'token',
      title: 'Access Token',
      type: 'short-input',
      layout: 'full',
      password: true,
      placeholder: 'dapi...',
      required: true,
    },
    {
      id: 'statement',
      title: 'SQL Statement',
      type: 'code',
      layout: 'full',
      placeholder: 'SELECT * FROM catalog.schema.table LIMIT 100',
      condition: { field: 'operation', value: ['databricks_execute_sql'] },
    },
    {
      id: 'warehouseId',
      title: 'Warehouse ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'abc123xyz',
      condition: { field: 'operation', value: ['databricks_execute_sql'] },
    },
    {
      id: 'jobId',
      title: 'Job ID',
      type: 'short-input',
      layout: 'full',
      placeholder: '123',
      condition: { field: 'operation', value: ['databricks_run_job', 'databricks_get_run_status'] },
    },
  ],
  tools: {
    access: [
      'databricks_execute_sql',
      'databricks_list_clusters',
      'databricks_list_jobs',
      'databricks_run_job',
      'databricks_get_run_status',
      'databricks_list_catalogs',
    ],
    config: {
      tool: (params) => params.operation || 'databricks_execute_sql',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    host: { type: 'string', description: 'Workspace URL' },
    token: { type: 'string', description: 'Access token' },
    statement: { type: 'string', description: 'SQL statement' },
    warehouseId: { type: 'string', description: 'Warehouse ID' },
    jobId: { type: 'string', description: 'Job ID' },
  },
  outputs: {
    rows: { type: 'json', description: 'Query results' },
    clusters: { type: 'json', description: 'Cluster list' },
    jobs: { type: 'json', description: 'Job list' },
    runId: { type: 'string', description: 'Run ID' },
  },
}
