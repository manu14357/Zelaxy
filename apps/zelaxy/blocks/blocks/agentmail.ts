import { MailIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const AgentMailBlock: BlockConfig = {
  type: 'agentmail',
  name: 'AgentMail',
  description: 'Send, reply, and manage email threads with AgentMail',
  longDescription:
    'Automate email workflows with AgentMail. Send messages, reply to threads, forward emails, create drafts, and list email threads.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#000000',
  icon: MailIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Send Message', id: 'agentmail_send_message' },
        { label: 'Reply to Message', id: 'agentmail_reply_message' },
        { label: 'Forward Message', id: 'agentmail_forward_message' },
        { label: 'List Threads', id: 'agentmail_list_threads' },
        { label: 'Get Thread', id: 'agentmail_get_thread' },
        { label: 'Create Draft', id: 'agentmail_create_draft' },
      ],
      required: true,
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      password: true,
      placeholder: 'Your AgentMail API key',
      required: true,
    },
    {
      id: 'inboxId',
      title: 'Inbox ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'inbox-id',
    },
    {
      id: 'to',
      title: 'To',
      type: 'short-input',
      layout: 'full',
      placeholder: 'recipient@example.com',
      condition: {
        field: 'operation',
        value: ['agentmail_send_message', 'agentmail_forward_message', 'agentmail_create_draft'],
      },
    },
    {
      id: 'subject',
      title: 'Subject',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Email subject',
      condition: {
        field: 'operation',
        value: ['agentmail_send_message', 'agentmail_create_draft'],
      },
    },
    {
      id: 'text',
      title: 'Message',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Email body text',
      condition: {
        field: 'operation',
        value: [
          'agentmail_send_message',
          'agentmail_reply_message',
          'agentmail_forward_message',
          'agentmail_create_draft',
        ],
      },
    },
    {
      id: 'threadId',
      title: 'Thread ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'thread-id',
      condition: {
        field: 'operation',
        value: ['agentmail_reply_message', 'agentmail_forward_message', 'agentmail_get_thread'],
      },
    },
  ],
  tools: {
    access: [
      'agentmail_send_message',
      'agentmail_reply_message',
      'agentmail_forward_message',
      'agentmail_list_threads',
      'agentmail_get_thread',
      'agentmail_create_draft',
    ],
    config: {
      tool: (params) => params.operation || 'agentmail_send_message',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'API key' },
    inboxId: { type: 'string', description: 'Inbox ID' },
    to: { type: 'string', description: 'Recipient' },
    subject: { type: 'string', description: 'Subject' },
    text: { type: 'string', description: 'Message body' },
    threadId: { type: 'string', description: 'Thread ID' },
  },
  outputs: {
    threadId: { type: 'string', description: 'Thread ID' },
    messageId: { type: 'string', description: 'Message ID' },
    status: { type: 'string', description: 'Status' },
    draftId: { type: 'string', description: 'Draft ID' },
  },
}
