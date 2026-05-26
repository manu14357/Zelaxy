import type { ToolConfig } from '@/tools/types'

export const dynamodbBatchWriteTool: ToolConfig = {
  id: 'dynamodb_batch_write',
  name: 'DynamoDB Batch Write',
  description: 'Perform multiple put and delete operations in a single DynamoDB batch write.',
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
    requestItems: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Batch request items as JSON (table → array of PutRequest/DeleteRequest)',
    },
  },

  request: {
    url: '/api/tools/dynamodb/batch-write',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({
      awsRegion: params.awsRegion,
      awsAccessKeyId: params.awsAccessKeyId,
      awsSecretAccessKey: params.awsSecretAccessKey,
      requestItems: JSON.parse(params.requestItems),
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error((data as { error?: string }).error || 'DynamoDB error')
    }
    return {
      success: true,
      output: { unprocessedItems: data.unprocessedItems ?? {} },
    }
  },

  outputs: {
    unprocessedItems: {
      type: 'json',
      description: 'Items that were not processed (empty if all succeeded)',
    },
  },
}
