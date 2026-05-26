import type { ToolConfig } from '@/tools/types'

export const dynamodbQueryTool: ToolConfig = {
  id: 'dynamodb_query',
  name: 'DynamoDB Query',
  description: 'Query a DynamoDB table using a key condition expression.',
  version: '1.0.0',

  params: {
    awsRegion: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'AWS region (e.g., us-east-1)',
    },
    awsAccessKeyId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'AWS access key ID',
    },
    awsSecretAccessKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'AWS secret access key',
    },
    tableName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'DynamoDB table name',
    },
    keyConditionExpression: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Key condition expression (e.g., "id = :id")',
    },
    expressionAttributeValues: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Expression attribute values as JSON',
    },
    indexName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Name of a global or local secondary index',
    },
    filterExpression: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter expression to apply after query',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of items to return',
    },
  },

  request: {
    url: '/api/tools/dynamodb/query',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      awsRegion: params.awsRegion,
      awsAccessKeyId: params.awsAccessKeyId,
      awsSecretAccessKey: params.awsSecretAccessKey,
      tableName: params.tableName,
      keyConditionExpression: params.keyConditionExpression,
      expressionAttributeValues: JSON.parse(params.expressionAttributeValues),
      ...(params.indexName ? { indexName: params.indexName } : {}),
      ...(params.filterExpression ? { filterExpression: params.filterExpression } : {}),
      ...(params.limit ? { limit: Number(params.limit) } : {}),
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error((data as { error?: string }).error || 'DynamoDB error')
    }
    return {
      success: true,
      output: {
        items: data.items ?? [],
        count: data.count ?? 0,
        lastEvaluatedKey: data.lastEvaluatedKey ?? null,
      },
    }
  },

  outputs: {
    items: { type: 'json', description: 'Array of matching items' },
    count: { type: 'number', description: 'Number of items returned' },
    lastEvaluatedKey: {
      type: 'json',
      description: 'Pagination key for next query',
      optional: true,
    },
  },
}
