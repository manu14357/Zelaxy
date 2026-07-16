import { LinqIcon } from '@/components/icons/linq-icon'
import type { BlockConfig } from '@/blocks/types'
import type { LinqResponse } from '@/tools/linq/types'

export const LinqBlock: BlockConfig<LinqResponse> = {
  type: 'linq',
  name: 'Linq',
  description: 'Send and read iMessage, SMS, and RCS chats with Linq',
  longDescription:
    'Send messages to chats, list chats, and list messages through the Linq messaging API. Authenticate with a Linq API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#0EA5E9',
  icon: LinqIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Send message', id: 'linq_send_message' },
        { label: 'List chats', id: 'linq_list_chats' },
        { label: 'List messages', id: 'linq_list_messages' },
      ],
      value: () => 'linq_send_message',
    },
    // Send message / List messages share chatId
    {
      id: 'chatId',
      title: 'Chat ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'chat_...',
      condition: { field: 'operation', value: ['linq_send_message', 'linq_list_messages'] },
    },
    // Send message
    {
      id: 'text',
      title: 'Text',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Hello!',
      condition: { field: 'operation', value: 'linq_send_message' },
    },
    {
      id: 'mediaUrl',
      title: 'Media URL',
      type: 'short-input',
      layout: 'half',
      placeholder: 'https://example.com/image.png',
      condition: { field: 'operation', value: 'linq_send_message' },
    },
    {
      id: 'linkUrl',
      title: 'Link URL',
      type: 'short-input',
      layout: 'half',
      placeholder: 'https://example.com',
      condition: { field: 'operation', value: 'linq_send_message' },
    },
    // List chats
    {
      id: 'from',
      title: 'From',
      type: 'short-input',
      layout: 'half',
      placeholder: '+15551234567',
      condition: { field: 'operation', value: 'linq_list_chats' },
    },
    {
      id: 'to',
      title: 'To',
      type: 'short-input',
      layout: 'half',
      placeholder: '+15557654321',
      condition: { field: 'operation', value: 'linq_list_chats' },
    },
    // Shared pagination for list ops
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '20',
      condition: { field: 'operation', value: ['linq_list_chats', 'linq_list_messages'] },
    },
    {
      id: 'cursor',
      title: 'Cursor',
      type: 'short-input',
      layout: 'half',
      placeholder: 'nextCursor value',
      condition: { field: 'operation', value: ['linq_list_chats', 'linq_list_messages'] },
    },
    {
      id: 'apiKey',
      title: 'Linq API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Linq API key',
      password: true,
      required: true,
    },
    // TRIGGER MODE: Trigger configuration (only shown when trigger mode is active)
    {
      id: 'triggerConfig',
      title: 'Trigger Configuration',
      type: 'trigger-config',
      layout: 'full',
      triggerProvider: 'linq',
      availableTriggers: ['linq_webhook'],
    },
  ],
  tools: {
    access: ['linq_send_message', 'linq_list_chats', 'linq_list_messages'],
    config: {
      tool: (params) => params.operation || 'linq_send_message',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Linq API key' },
    chatId: { type: 'string', description: 'Chat ID' },
    text: { type: 'string', description: 'Message text' },
    mediaUrl: { type: 'string', description: 'Media URL' },
    linkUrl: { type: 'string', description: 'Link URL' },
    from: { type: 'string', description: 'Sender phone number' },
    to: { type: 'string', description: 'Participant handle' },
    limit: { type: 'number', description: 'Result limit' },
    cursor: { type: 'string', description: 'Pagination cursor' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Linq' },
    metadata: { type: 'json', description: 'Response metadata' },
    event_type: { type: 'string', description: 'Linq event type (trigger events)' },
    message_id: { type: 'string', description: 'Message ID' },
    status: { type: 'string', description: 'Message status' },
    body: { type: 'string', description: 'Message body' },
  },
  triggers: {
    enabled: true,
    available: ['linq_webhook'],
  },
}
