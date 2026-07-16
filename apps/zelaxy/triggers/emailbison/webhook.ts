import { MailIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const emailbisonWebhookTrigger: TriggerConfig = {
  id: 'emailbison_webhook',
  name: 'EmailBison Webhook',
  provider: 'emailbison',
  description:
    'Trigger workflow from EmailBison events like replies received and sending accounts disconnecting',
  version: '1.0.0',
  icon: MailIcon,

  configFields: {
    webhookToken: {
      type: 'string',
      label: 'Webhook Token (Recommended)',
      placeholder: 'Enter the value configured in the provider',
      description:
        'A token you set on the EmailBison webhook. Zelaxy requires it verbatim in the Authorization header.',
      required: false,
      isSecret: true,
    },
  },

  // Flattened by formatWebhookInput's emailbison case
  outputs: {
    event_type: {
      type: 'string',
      description: 'Event type (reply_received, email_opened, email_account_disconnected)',
    },
    campaign_id: { type: 'string', description: 'Campaign ID' },
    campaign_name: { type: 'string', description: 'Campaign name' },
    lead_email: { type: 'string', description: 'Lead email address' },
    email_account: { type: 'string', description: 'Sending email account' },
    subject: { type: 'string', description: 'Email subject' },
    reply_text: { type: 'string', description: 'Reply body (reply events)' },
    timestamp: { type: 'string', description: 'When the event occurred' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'In EmailBison, open Settings > Webhooks.',
    'Add a webhook and paste the <strong>Webhook URL</strong> (from above).',
    'Set the Authorization header value and copy the same value into the field above.',
    'Select the events you want.',
  ],

  samplePayload: {
    event: 'reply_received',
    campaign_id: 'camp_1',
    lead_email: 'ada@example.com',
    email_account: 'sales@zelaxy.in',
    subject: 'Re: Intro',
    reply_text: 'Sounds good',
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: '<your-token>',
    },
  },
}
