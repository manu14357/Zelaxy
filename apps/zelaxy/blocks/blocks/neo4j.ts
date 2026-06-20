import { Neo4jIcon } from '@/components/icons/neo4j-icon'
import type { BlockConfig } from '@/blocks/types'
import type { Neo4jResponse } from '@/tools/neo4j/types'

export const Neo4jBlock: BlockConfig<Neo4jResponse> = {
  type: 'neo4j',
  name: 'Neo4j',
  description: 'Run Cypher queries against a Neo4j database via the HTTP Query API',
  longDescription:
    'Execute Cypher statements against a Neo4j database through the HTTP Query API. Authenticate with your database URL, username, and password.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#018BFF',
  icon: Neo4jIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [{ label: 'Run query', id: 'neo4j_run_query' }],
      value: () => 'neo4j_run_query',
    },
    {
      id: 'statement',
      title: 'Cypher Statement',
      type: 'long-input',
      layout: 'full',
      placeholder: 'MATCH (n) RETURN n LIMIT 10',
      condition: { field: 'operation', value: 'neo4j_run_query' },
    },
    {
      id: 'parameters',
      title: 'Parameters',
      type: 'long-input',
      layout: 'full',
      placeholder: '{ "name": "Jane" }',
      condition: { field: 'operation', value: 'neo4j_run_query' },
    },
    // Connection
    {
      id: 'dbUrl',
      title: 'Database URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://<id>.databases.neo4j.io',
      required: true,
    },
    {
      id: 'username',
      title: 'Username',
      type: 'short-input',
      layout: 'half',
      placeholder: 'neo4j',
      required: true,
    },
    {
      id: 'password',
      title: 'Password',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Your Neo4j password',
      password: true,
      required: true,
    },
    {
      id: 'database',
      title: 'Database',
      type: 'short-input',
      layout: 'half',
      placeholder: 'neo4j',
      required: true,
    },
  ],
  tools: {
    access: ['neo4j_run_query'],
    config: {
      tool: (params) => params.operation || 'neo4j_run_query',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    dbUrl: { type: 'string', description: 'Neo4j database URL' },
    username: { type: 'string', description: 'Neo4j username' },
    password: { type: 'string', description: 'Neo4j password' },
    database: { type: 'string', description: 'Database name' },
    statement: { type: 'string', description: 'Cypher statement' },
    parameters: { type: 'json', description: 'Cypher statement parameters' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from the Neo4j Query API' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
