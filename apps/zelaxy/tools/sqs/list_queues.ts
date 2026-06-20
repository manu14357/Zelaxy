import { awsJsonHeaders } from '@/lib/aws/sigv4'
import type { SqsListQueuesParams, SqsResponse } from '@/tools/sqs/types'
import type { ToolConfig } from '@/tools/types'

const buildPayload = (p: SqsListQueuesParams) => (p.prefix ? { QueueNamePrefix: p.prefix } : {})

export const listQueuesTool: ToolConfig<SqsListQueuesParams, SqsResponse> = {
  id: 'sqs_list_queues',
  name: 'SQS List Queues',
  description: 'List Amazon SQS queues, optionally filtered by name prefix',
  version: '1.0.0',

  params: {
    awsRegion: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'AWS region (e.g. us-east-1)',
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
    prefix: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter queues by name prefix',
    },
  },

  request: {
    url: (p) => `https://sqs.${p.awsRegion}.amazonaws.com/`,
    method: 'POST',
    headers: (p) =>
      awsJsonHeaders({
        region: p.awsRegion,
        service: 'sqs',
        target: 'AmazonSQS.ListQueues',
        accessKeyId: p.awsAccessKeyId,
        secretAccessKey: p.awsSecretAccessKey,
        body: JSON.stringify(buildPayload(p)),
      }),
    body: (p) => buildPayload(p),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return { success: true, output: { data } }
  },

  outputs: {
    data: { type: 'json', description: 'SQS ListQueues result (QueueUrls array)' },
  },
}
