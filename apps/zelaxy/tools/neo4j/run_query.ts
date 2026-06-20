import type { Neo4jResponse, Neo4jRunQueryParams } from '@/tools/neo4j/types'
import type { ToolConfig } from '@/tools/types'

export const runQueryTool: ToolConfig<Neo4jRunQueryParams, Neo4jResponse> = {
  id: 'neo4j_run_query',
  name: 'Neo4j Run Query',
  description: 'Run a Cypher query against a Neo4j database via the HTTP Query API',
  version: '1.0.0',

  params: {
    dbUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Neo4j database URL, e.g. https://<id>.databases.neo4j.io',
    },
    username: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Neo4j username',
    },
    password: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Neo4j password',
    },
    database: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'The database name (default neo4j)',
    },
    statement: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The Cypher statement to execute',
    },
    parameters: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Parameters referenced by the Cypher statement',
    },
  },

  request: {
    url: (params) => `${params.dbUrl}/db/${params.database}/query/v2`,
    method: 'POST',
    headers: (params) => ({
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${params.username}:${params.password}`).toString('base64')}`,
    }),
    body: (params) => ({
      statement: params.statement,
      parameters: params.parameters || {},
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: {} },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Neo4j Query API result' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
