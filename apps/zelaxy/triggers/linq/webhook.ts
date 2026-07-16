import { LinqIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const linqWebhookTrigger: TriggerConfig = {
  id: 'linq_webhook',
  name: 'Linq Webhook',
  provider: 'linq',
  description:
    'Trigger workflow from Linq messaging events like messages being delivered, failing, or replied to',
  version: '1.0.0',
  icon: LinqIcon,

  configFields: {},

  // Flattened by formatWebhookInput's linq case
  outputs: {
    event_type: {
      type: 'string',
      description: 'Event type (message.delivered, message.failed, message.received)',
    },
    message_id: { type: 'string', description: 'Message ID' },
    status: { type: 'string', description: 'Message status' },
    from: { type: 'string', description: 'Sender' },
    to: { type: 'string', description: 'Recipient' },
    body: { type: 'string', description: 'Message body' },
    error_message: { type: 'string', description: 'Error message, when the message failed' },
    timestamp: { type: 'string', description: 'When the event occurred' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'In Linq, open the webhook or integration settings for your account.',
    'Paste the <strong>Webhook URL</strong> (from above) as the target.',
    'Select the message events you want.',
    'Linq does not sign webhooks - treat the URL as the secret and do not share it.',
  ],

  samplePayload: {
    type: 'message.delivered',
    messageId: 'msg_1',
    status: 'delivered',
    from: '+15551234567',
    to: '+15559876543',
    body: 'Thanks!',
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
