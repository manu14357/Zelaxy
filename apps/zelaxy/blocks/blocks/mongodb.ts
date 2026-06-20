import { MongodbIcon } from '@/components/icons/mongodb-icon'
import type { BlockConfig } from '@/blocks/types'
import type { MongodbResponse } from '@/tools/mongodb/types'

export const MongodbBlock: BlockConfig<MongodbResponse> = {
  type: 'mongodb',
  name: 'MongoDB',
  description: 'Query and modify documents using the MongoDB Atlas Data API',
  longDescription:
    'Find, insert, update, and delete documents in a MongoDB collection through the Atlas Data API over HTTP. Authenticate with your Data API URL, key, cluster (data source), and database.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#00ED64',
  icon: MongodbIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Find', id: 'mongodb_find' },
        { label: 'Insert one', id: 'mongodb_insert_one' },
        { label: 'Update one', id: 'mongodb_update_one' },
        { label: 'Delete one', id: 'mongodb_delete_one' },
      ],
      value: () => 'mongodb_find',
    },
    {
      id: 'collection',
      title: 'Collection',
      type: 'short-input',
      layout: 'full',
      placeholder: 'myCollection',
      condition: {
        field: 'operation',
        value: ['mongodb_find', 'mongodb_insert_one', 'mongodb_update_one', 'mongodb_delete_one'],
      },
    },
    // Find
    {
      id: 'filter',
      title: 'Filter',
      type: 'long-input',
      layout: 'full',
      placeholder: '{ "status": "active" }',
      condition: {
        field: 'operation',
        value: ['mongodb_find', 'mongodb_update_one', 'mongodb_delete_one'],
      },
    },
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '10',
      condition: { field: 'operation', value: 'mongodb_find' },
    },
    // Insert one
    {
      id: 'document',
      title: 'Document',
      type: 'long-input',
      layout: 'full',
      placeholder: '{ "name": "Jane", "email": "jane@example.com" }',
      condition: { field: 'operation', value: 'mongodb_insert_one' },
    },
    // Update one
    {
      id: 'update',
      title: 'Update',
      type: 'long-input',
      layout: 'full',
      placeholder: '{ "$set": { "status": "inactive" } }',
      condition: { field: 'operation', value: 'mongodb_update_one' },
    },
    // Connection
    {
      id: 'dataApiUrl',
      title: 'Data API URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://data.mongodb-api.com/app/<appId>/endpoint/data/v1',
      required: true,
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Atlas Data API key',
      password: true,
      required: true,
    },
    {
      id: 'dataSource',
      title: 'Data Source (Cluster)',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Cluster0',
      required: true,
    },
    {
      id: 'database',
      title: 'Database',
      type: 'short-input',
      layout: 'half',
      placeholder: 'myDatabase',
      required: true,
    },
  ],
  tools: {
    access: ['mongodb_find', 'mongodb_insert_one', 'mongodb_update_one', 'mongodb_delete_one'],
    config: {
      tool: (params) => params.operation || 'mongodb_find',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    dataApiUrl: { type: 'string', description: 'Atlas Data API base URL' },
    apiKey: { type: 'string', description: 'Atlas Data API key' },
    dataSource: { type: 'string', description: 'Cluster (data source) name' },
    database: { type: 'string', description: 'Database name' },
    collection: { type: 'string', description: 'Collection name' },
    filter: { type: 'json', description: 'Query filter document' },
    limit: { type: 'number', description: 'Maximum documents to return' },
    document: { type: 'json', description: 'Document to insert' },
    update: { type: 'json', description: 'Update document' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from the MongoDB Data API' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
