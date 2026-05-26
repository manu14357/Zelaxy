import type { ToolConfig } from '@/tools/types'

export const dynamodbPutItemTool: ToolConfig = {
  id: 'dynamodb_put_item',
  name: 'DynamoDB Put Item',
  description: 'Put (insert or replace) an item in a DynamoDB table.',
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
    item: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Item to put as JSON (e.g., {"id": {"S": "123"}, "name": {"S": "Alice"}})',
    },
  },

  request: {
    url: '/api/tools/dynamodb/put',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      awsRegion: params.awsRegion,
      awsAccessKeyId: params.awsAccessKeyId,
      awsSecretAccessKey: params.awsSecretAccessKey,
      tableName: params.tableName,
      item: JSON.parse(params.item),
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error((data as { error?: string }).error || 'DynamoDB error')
    }
    return { success: true, output: { success: true } }
  },

  outputs: {
    success: { type: 'boolean', description: 'Whether the item was put successfully' },
  },
}
