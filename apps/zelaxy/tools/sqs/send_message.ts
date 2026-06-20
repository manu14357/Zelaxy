import { awsJsonHeaders } from '@/lib/aws/sigv4'
import type { SqsResponse, SqsSendMessageParams } from '@/tools/sqs/types'
import type { ToolConfig } from '@/tools/types'

const buildPayload = (p: SqsSendMessageParams) => ({
  QueueUrl: p.queueUrl,
  MessageBody: p.messageBody,
})

export const sendMessageTool: ToolConfig<SqsSendMessageParams, SqsResponse> = {
  id: 'sqs_send_message',
  name: 'SQS Send Message',
  description: 'Send a message to an Amazon SQS queue',
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
    messageBody: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The message body to send',
    },
  },

  request: {
    url: (p) => `https://sqs.${p.awsRegion}.amazonaws.com/`,
    method: 'POST',
    headers: (p) =>
      awsJsonHeaders({
        region: p.awsRegion,
        service: 'sqs',
        target: 'AmazonSQS.SendMessage',
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
    data: { type: 'json', description: 'SQS SendMessage result (MessageId, MD5, …)' },
  },
}
