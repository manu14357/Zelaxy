import { SqsIcon } from '@/components/icons/sqs-icon'
import type { BlockConfig } from '@/blocks/types'
import type { SqsResponse } from '@/tools/sqs/types'

export const SqsBlock: BlockConfig<SqsResponse> = {
  type: 'sqs',
  name: 'Amazon SQS',
  description: 'Send, receive, and list messages on Amazon SQS queues',
  longDescription:
    'Interact with Amazon Simple Queue Service (SQS): send messages, receive messages, and list queues. Authenticate with AWS access key credentials (SigV4 signed).',
  docsLink: '#',
  category: 'tools',
  bgColor: '#FF4F8B',
  icon: SqsIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Send message', id: 'sqs_send_message' },
        { label: 'Receive messages', id: 'sqs_receive_message' },
        { label: 'List queues', id: 'sqs_list_queues' },
      ],
      value: () => 'sqs_send_message',
    },
    {
      id: 'queueUrl',
      title: 'Queue URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
      condition: { field: 'operation', value: ['sqs_send_message', 'sqs_receive_message'] },
    },
    {
      id: 'messageBody',
      title: 'Message Body',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Message content',
      condition: { field: 'operation', value: 'sqs_send_message' },
    },
    {
      id: 'maxMessages',
      title: 'Max Messages',
      type: 'short-input',
      layout: 'half',
      placeholder: '10',
      condition: { field: 'operation', value: 'sqs_receive_message' },
    },
    {
      id: 'prefix',
      title: 'Queue Name Prefix',
      type: 'short-input',
      layout: 'half',
      placeholder: 'optional',
      condition: { field: 'operation', value: 'sqs_list_queues' },
    },
    {
      id: 'awsRegion',
      title: 'AWS Region',
      type: 'short-input',
      layout: 'half',
      placeholder: 'us-east-1',
      required: true,
    },
    {
      id: 'awsAccessKeyId',
      title: 'AWS Access Key ID',
      type: 'short-input',
      layout: 'half',
      password: true,
      required: true,
    },
    {
      id: 'awsSecretAccessKey',
      title: 'AWS Secret Access Key',
      type: 'short-input',
      layout: 'full',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['sqs_send_message', 'sqs_receive_message', 'sqs_list_queues'],
    config: {
      tool: (params) => params.operation || 'sqs_send_message',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    awsRegion: { type: 'string', description: 'AWS region' },
    awsAccessKeyId: { type: 'string', description: 'AWS access key ID' },
    awsSecretAccessKey: { type: 'string', description: 'AWS secret access key' },
    queueUrl: { type: 'string', description: 'SQS queue URL' },
    messageBody: { type: 'string', description: 'Message body' },
    maxMessages: { type: 'number', description: 'Max messages to receive' },
    prefix: { type: 'string', description: 'Queue name prefix' },
  },
  outputs: {
    data: { type: 'json', description: 'SQS API response' },
  },
}
