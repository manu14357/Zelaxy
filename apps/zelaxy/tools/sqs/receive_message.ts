import { awsJsonHeaders } from '@/lib/aws/sigv4'
import type { SqsReceiveMessageParams, SqsResponse } from '@/tools/sqs/types'
import type { ToolConfig } from '@/tools/types'

const buildPayload = (p: SqsReceiveMessageParams) => ({
  QueueUrl: p.queueUrl,
  MaxNumberOfMessages: p.maxMessages ?? 10,
})

export const receiveMessageTool: ToolConfig<SqsReceiveMessageParams, SqsResponse> = {
  id: 'sqs_receive_message',
  name: 'SQS Receive Messages',
  description: 'Receive messages from an Amazon SQS queue',
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
    queueUrl: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The SQS queue URL',
    },
    maxMessages: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Max messages to return (1-10, default 10)',
    },
  },

  request: {
    url: (p) => `https://sqs.${p.awsRegion}.amazonaws.com/`,
    method: 'POST',
    headers: (p) =>
      awsJsonHeaders({
        region: p.awsRegion,
        service: 'sqs',
        target: 'AmazonSQS.ReceiveMessage',
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
    data: { type: 'json', description: 'SQS ReceiveMessage result (Messages array)' },
  },
}
