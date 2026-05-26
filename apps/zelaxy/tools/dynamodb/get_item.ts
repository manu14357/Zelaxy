import type { ToolConfig } from '@/tools/types'

export const dynamodbGetItemTool: ToolConfig = {
  id: 'dynamodb_get_item',
  name: 'DynamoDB Get Item',
  description: 'Get a single item from a DynamoDB table by its primary key.',
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
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Primary key as JSON (e.g., {"id": {"S": "123"}})',
    },
  },

  request: {
    url: '/api/tools/dynamodb/get',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      awsRegion: params.awsRegion,
      awsAccessKeyId: params.awsAccessKeyId,
      awsSecretAccessKey: params.awsSecretAccessKey,
      tableName: params.tableName,
      key: JSON.parse(params.key),
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error((data as { error?: string }).error || 'DynamoDB error')
    }
    return { success: true, output: { item: data.item ?? null } }
  },

  outputs: {
    item: { type: 'json', description: 'The retrieved item', optional: true },
  },
}
