import type { MongodbInsertOneParams, MongodbResponse } from '@/tools/mongodb/types'
import type { ToolConfig } from '@/tools/types'

export const insertOneTool: ToolConfig<MongodbInsertOneParams, MongodbResponse> = {
  id: 'mongodb_insert_one',
  name: 'MongoDB Insert One',
  description: 'Insert a single document into a MongoDB collection via the Atlas Data API',
  version: '1.0.0',

  params: {
    dataApiUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description:
        'MongoDB Atlas Data API base URL, e.g. https://data.mongodb-api.com/app/<appId>/endpoint/data/v1',
    },
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'MongoDB Atlas Data API key',
    },
    dataSource: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'The cluster (data source) name',
    },
    database: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'The database name',
    },
    collection: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The collection name',
    },
    document: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description: 'The document to insert',
    },
  },

  request: {
    url: (params) => `${params.dataApiUrl}/action/insertOne`,
    method: 'POST',
    headers: (params) => ({
      'Content-Type': 'application/json',
      'api-key': params.apiKey,
      'Access-Control-Request-Headers': '*',
    }),
    body: (params) => ({
      dataSource: params.dataSource,
      database: params.database,
      collection: params.collection,
      document: params.document || {},
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
    data: { type: 'json', description: 'The MongoDB Data API insertOne result' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
