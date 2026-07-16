import { ResendIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const resendWebhookTrigger: TriggerConfig = {
  id: 'resend_webhook',
  name: 'Resend Webhook',
  provider: 'resend',
  description:
    'Trigger workflow from Resend email events like sent, delivered, opened, clicked, bounced, or complained',
  version: '1.0.0',
  icon: ResendIcon,

  configFields: {
    signingSecret: {
      type: 'string',
      label: 'Signing Secret (Recommended)',
      placeholder: 'whsec_...',
      description:
        'Shown on the Resend webhook. Resend signs deliveries with Svix; mismatches are rejected.',
      required: false,
      isSecret: true,
    },
  },

  // Flattened by formatWebhookInput's resend case
  outputs: {
    event_type: {
      type: 'string',
      description:
        'Event type (email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained, email.delivery_delayed)',
    },
    created_at: { type: 'string', description: 'When the event occurred' },
    email_id: { type: 'string', description: 'ID of the email the event relates to' },
    from: { type: 'string', description: 'Sender address' },
    to: { type: 'array', description: 'Recipient addresses' },
    to_email: { type: 'string', description: 'First recipient address, for convenience' },
    subject: { type: 'string', description: 'Email subject' },
    click_link: { type: 'string', description: 'Clicked URL (email.clicked)' },
    click_timestamp: { type: 'string', description: 'When the link was clicked' },
    bounce_type: { type: 'string', description: 'Bounce type (email.bounced)' },
    bounce_message: { type: 'string', description: 'Bounce message' },
    failure_reason: { type: 'string', description: 'Failure reason (email.failed)' },
    data: { type: 'object', description: 'Full data object as sent by Resend' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to the <a href="https://resend.com/webhooks" target="_blank" rel="noopener noreferrer">Resend Dashboard</a> > Webhooks.',
    'Click "Add Webhook".',
    'Paste the <strong>Webhook URL</strong> (from above) into the "Endpoint URL" field.',
    'Select the events you want (e.g. email.delivered, email.opened, email.bounced).',
    'Add the webhook, then copy its <strong>Signing Secret</strong> (starts with <code>whsec_</code>) into the field above.',
  ],

  samplePayload: {
    type: 'email.delivered',
    created_at: '2024-01-15T13:14:15.000Z',
    data: {
      email_id: '4ef9a417-02e9-4d39-ad75-9611e0fcc33c',
      from: 'noreply@zelaxy.in',
      to: ['ada@example.com'],
      subject: 'Welcome to Zelaxy',
      created_at: '2024-01-15T13:14:10.000Z',
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'svix-id': 'msg_2abc123',
      'svix-timestamp': '1705324455',
      'svix-signature': 'v1,<base64-hmac>',
    },
  },
}
