import { SendblueIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const sendblueWebhookTrigger: TriggerConfig = {
  id: 'sendblue_webhook',
  name: 'Sendblue Webhook',
  provider: 'sendblue',
  description:
    'Trigger workflow from Sendblue iMessage and SMS events like messages received or status changing',
  version: '1.0.0',
  icon: SendblueIcon,

  configFields: {},

  // Flattened by formatWebhookInput's sendblue case
  outputs: {
    event_type: {
      type: 'string',
      description: 'Event type (message.received, message.status_updated)',
    },
    message_handle: { type: 'string', description: 'Sendblue message handle' },
    from_number: { type: 'string', description: 'Sender number' },
    to_number: { type: 'string', description: 'Recipient number' },
    content: { type: 'string', description: 'Message content' },
    status: { type: 'string', description: 'Message status' },
    error_message: { type: 'string', description: 'Error message, when present' },
    is_outbound: { type: 'boolean', description: 'Whether the message was outbound' },
    media_url: { type: 'string', description: 'Media URL, when present' },
    date_sent: { type: 'string', description: 'When the message was sent' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to Sendblue > Dashboard > Settings and open the webhook configuration.',
    'Paste the <strong>Webhook URL</strong> (from above) as the "Receive URL".',
    'Save the configuration and send a test message.',
    'Sendblue does not sign webhooks - treat the URL as the secret and do not share it.',
  ],

  samplePayload: {
    content: 'Hello!',
    is_outbound: false,
    status: 'RECEIVED',
    message_handle: 'msg_1',
    from_number: '+15551234567',
    to_number: '+15559876543',
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
