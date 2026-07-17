import { MailIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const ImapBlock: BlockConfig = {
  type: 'imap',
  name: 'IMAP Email',
  description: 'Trigger workflows when new emails arrive via IMAP (works with any email provider)',
  longDescription:
    'Connect to any mailbox over IMAP to start a workflow when new email arrives. Works with Gmail, Outlook, Yahoo, Fastmail, or any IMAP-compatible provider. Zelaxy polls the mailbox — there is no webhook to register. This is a trigger-only block: it starts workflows and exposes no operations to call.',
  docsLink: '#',
  category: 'triggers',
  bgColor: '#6366F1',
  icon: MailIcon,
  subBlocks: [
    // TRIGGER MODE: Trigger configuration (only shown when trigger mode is active)
    {
      id: 'triggerConfig',
      title: 'Trigger Configuration',
      type: 'trigger-config',
      layout: 'full',
      triggerProvider: 'imap',
      availableTriggers: ['imap_poller'],
    },
  ],
  tools: {
    access: [],
  },
  inputs: {},
  outputs: {
    message_id: { type: 'string', description: 'RFC Message-ID header' },
    uid: { type: 'number', description: 'IMAP UID within the mailbox' },
    subject: { type: 'string', description: 'Email subject' },
    from: { type: 'string', description: 'Sender email address' },
    from_name: { type: 'string', description: 'Sender display name' },
    to: { type: 'json', description: 'Recipient email addresses' },
    cc: { type: 'json', description: 'CC email addresses' },
    date: { type: 'string', description: 'Email date in ISO format' },
    body_text: { type: 'string', description: 'Plain text body' },
    mailbox: { type: 'string', description: 'Mailbox the email arrived in' },
    has_attachments: { type: 'boolean', description: 'Whether the email has attachments' },
  },
  triggers: {
    enabled: true,
    available: ['imap_poller'],
  },
}
