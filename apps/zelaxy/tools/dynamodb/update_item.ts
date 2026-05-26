import type { ToolConfig } from '@/tools/types'

export const dynamodbUpdateItemTool: ToolConfig = {
  id: 'dynamodb_update_item',
  name: 'DynamoDB Update Item',
  description: 'Update attributes of an existing item in a DynamoDB table.',
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
      description: 'Primary key as JSON',
    },
    updateExpression: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Update expression (e.g., "SET #n = :name")',
    },
    expressionAttributeValues: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Expression attribute values as JSON',
    },
  },

  request: {
    url: '/api/tools/dynamodb/update',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      awsRegion: params.awsRegion,
      awsAccessKeyId: params.awsAccessKeyId,
      awsSecretAccessKey: params.awsSecretAccessKey,
      tableName: params.tableName,
      key: JSON.parse(params.key),
      updateExpression: params.updateExpression,
      expressionAttributeValues: JSON.parse(params.expressionAttributeValues),
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error((data as { error?: string }).error || 'DynamoDB error')
    }
    return { success: true, output: { attributes: data.attributes ?? null } }
  },

  outputs: {
    attributes: { type: 'json', description: 'Updated item attributes', optional: true },
  },
}
