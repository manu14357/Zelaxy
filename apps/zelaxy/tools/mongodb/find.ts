import type { MongodbFindParams, MongodbResponse } from '@/tools/mongodb/types'
import type { ToolConfig } from '@/tools/types'

export const findTool: ToolConfig<MongodbFindParams, MongodbResponse> = {
  id: 'mongodb_find',
  name: 'MongoDB Find',
  description: 'Find documents in a MongoDB collection via the Atlas Data API',
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
    filter: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'MongoDB query filter document',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of documents to return',
    },
  },

  request: {
    url: (params) => `${params.dataApiUrl}/action/find`,
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
      filter: params.filter || {},
      ...(params.limit !== undefined ? { limit: params.limit } : {}),
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
    data: { type: 'json', description: 'The MongoDB Data API find result' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
