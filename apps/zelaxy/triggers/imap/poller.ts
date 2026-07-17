import { MailIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const imapPollingTrigger: TriggerConfig = {
  id: 'imap_poller',
  name: 'IMAP Email',
  provider: 'imap',
  description:
    'Trigger workflow when a new email arrives, using IMAP — works with any email provider',
  version: '1.0.0',
  icon: MailIcon,

  configFields: {
    host: {
      type: 'string',
      label: 'IMAP Host',
      placeholder: 'imap.gmail.com',
      description: "Your provider's IMAP server (e.g. imap.gmail.com, outlook.office365.com).",
      required: true,
    },
    port: {
      type: 'number',
      label: 'Port',
      defaultValue: 993,
      description: '993 for SSL/TLS (the usual choice), 143 for STARTTLS.',
      required: true,
    },
    secure: {
      type: 'boolean',
      label: 'Use SSL/TLS',
      defaultValue: true,
      description: 'Leave enabled for port 993. Disable only for a STARTTLS server on port 143.',
      required: false,
    },
    username: {
      type: 'string',
      label: 'Username',
      placeholder: 'you@example.com',
      description: 'The mailbox username, usually your full email address.',
      required: true,
    },
    password: {
      type: 'string',
      label: 'Password',
      placeholder: 'App password',
      description:
        'Use an app password, not your account password — Gmail and Outlook reject account passwords over IMAP when 2FA is on.',
      required: true,
      isSecret: true,
    },
    mailbox: {
      type: 'string',
      label: 'Mailbox',
      defaultValue: 'INBOX',
      placeholder: 'INBOX',
      description: 'Folder to watch. Defaults to INBOX.',
      required: false,
    },
    markAsRead: {
      type: 'boolean',
      label: 'Mark as read',
      defaultValue: false,
      description: 'Mark each email as read once it has started a workflow run.',
      required: false,
    },
  },

  // Flattened by formatWebhookInput's imap case
  outputs: {
    message_id: { type: 'string', description: 'RFC Message-ID header' },
    uid: { type: 'number', description: 'IMAP UID within the mailbox' },
    subject: { type: 'string', description: 'Email subject (also the workflow input)' },
    from: { type: 'string', description: 'Sender email address' },
    from_name: { type: 'string', description: 'Sender display name' },
    to: { type: 'array', description: 'Recipient email addresses' },
    cc: { type: 'array', description: 'CC email addresses' },
    date: { type: 'string', description: 'Email date in ISO format' },
    body_text: { type: 'string', description: 'Plain text body, when available' },
    mailbox: { type: 'string', description: 'Mailbox the email arrived in' },
    has_attachments: { type: 'boolean', description: 'Whether the email has attachments' },
    raw: { type: 'object', description: 'Complete payload as delivered by the poller' },
  },

  instructions: [
    "Enter your provider's <strong>IMAP Host</strong> and <strong>Port</strong> above (Gmail: <code>imap.gmail.com</code>:993, Outlook: <code>outlook.office365.com</code>:993).",
    '<strong>Use an app password, not your account password.</strong> Gmail and Outlook refuse account passwords over IMAP once 2FA is enabled.',
    'Gmail: enable IMAP in Settings > Forwarding and POP/IMAP, then create an app password at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">myaccount.google.com/apppasswords</a>.',
    'There is no webhook URL to register — Zelaxy connects to your mailbox and polls it.',
    'The workflow runs <strong>once per new email</strong>. Connecting a mailbox does not replay existing mail: the first poll records where the mailbox is and triggers nothing.',
  ],

  samplePayload: {
    mailbox: 'INBOX',
    email: {
      uid: 1042,
      messageId: '<CAF=abc123@mail.example.com>',
      subject: 'Invoice #4102',
      from: { address: 'billing@vendor.com', name: 'Vendor Billing' },
      to: ['ada@example.com'],
      cc: [],
      date: '2024-01-15T13:14:15.000Z',
      bodyText: 'Your invoice is attached.',
      hasAttachments: true,
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
