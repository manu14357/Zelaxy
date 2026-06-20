import { SendblueIcon } from '@/components/icons/sendblue-icon'
import type { BlockConfig } from '@/blocks/types'
import type { SendblueResponse } from '@/tools/sendblue/types'

export const SendblueBlock: BlockConfig<SendblueResponse> = {
  type: 'sendblue',
  name: 'Sendblue',
  description: 'Send iMessage/SMS and read messages with Sendblue',
  longDescription:
    'Send messages and retrieve account messages through the Sendblue API. Authenticate with a Sendblue API key ID and secret.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#1976FF',
  icon: SendblueIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Send message', id: 'sendblue_send_message' },
        { label: 'Get messages', id: 'sendblue_get_messages' },
      ],
      value: () => 'sendblue_send_message',
    },
    // Send message
    {
      id: 'number',
      title: 'Number',
      type: 'short-input',
      layout: 'half',
      placeholder: '+19998887777',
      condition: { field: 'operation', value: 'sendblue_send_message' },
    },
    {
      id: 'content',
      title: 'Content',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Message text',
      condition: { field: 'operation', value: 'sendblue_send_message' },
    },
    {
      id: 'apiKeyId',
      title: 'API Key ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Sendblue API key ID',
      password: true,
      required: true,
    },
    {
      id: 'apiSecret',
      title: 'API Secret',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Sendblue API secret',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['sendblue_send_message', 'sendblue_get_messages'],
    config: {
      tool: (params) => params.operation || 'sendblue_send_message',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKeyId: { type: 'string', description: 'Sendblue API key ID' },
    apiSecret: { type: 'string', description: 'Sendblue API secret key' },
    number: { type: 'string', description: 'Recipient phone number' },
    content: { type: 'string', description: 'Message content' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Sendblue' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
