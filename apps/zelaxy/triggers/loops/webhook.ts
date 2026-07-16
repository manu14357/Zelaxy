import { LoopsIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const loopsWebhookTrigger: TriggerConfig = {
  id: 'loops_webhook',
  name: 'Loops Webhook',
  provider: 'loops',
  description:
    'Trigger workflow from Loops email events like sent, delivered, opened, clicked, and bounced',
  version: '1.0.0',
  icon: LoopsIcon,

  configFields: {},

  // Flattened by formatWebhookInput's loops case
  outputs: {
    event_type: {
      type: 'string',
      description: 'Event type (email.sent, email.delivered, email.opened, email.clicked)',
    },
    email: { type: 'string', description: 'Recipient email address' },
    contact_id: { type: 'string', description: 'Loops contact ID' },
    campaign_id: { type: 'string', description: 'Campaign ID, when present' },
    campaign_name: { type: 'string', description: 'Campaign name' },
    email_message_id: { type: 'string', description: 'Message ID' },
    link_url: { type: 'string', description: 'Clicked link (click events)' },
    timestamp: { type: 'string', description: 'When the event occurred' },
    data: { type: 'object', description: 'Full data object as sent by Loops' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to Loops > Settings > Webhooks.',
    'Add an endpoint and paste the <strong>Webhook URL</strong> (from above).',
    'Select the email events you want.',
    'Loops does not sign webhooks - treat the URL as the secret and do not share it.',
  ],

  samplePayload: {
    type: 'email.opened',
    timestamp: '2024-01-15T13:14:15Z',
    data: {
      email: 'ada@example.com',
      contactId: 'cont_1',
      campaignId: 'camp_1',
      campaignName: 'Welcome series',
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
