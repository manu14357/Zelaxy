import type { ToolConfig } from '@/tools/types'

export const dynamodbScanTool: ToolConfig = {
  id: 'dynamodb_scan',
  name: 'DynamoDB Scan',
  description: 'Scan an entire DynamoDB table, optionally filtering results.',
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
    filterExpression: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter expression to apply after scan',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of items to return',
    },
  },

  request: {
    url: '/api/tools/dynamodb/scan',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      awsRegion: params.awsRegion,
      awsAccessKeyId: params.awsAccessKeyId,
      awsSecretAccessKey: params.awsSecretAccessKey,
      tableName: params.tableName,
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
    items: { type: 'json', description: 'Array of scanned items' },
    count: { type: 'number', description: 'Number of items returned' },
    lastEvaluatedKey: { type: 'json', description: 'Pagination key for next scan', optional: true },
  },
}
