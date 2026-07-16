import { InstantlyIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const instantlyWebhookTrigger: TriggerConfig = {
  id: 'instantly_webhook',
  name: 'Instantly Webhook',
  provider: 'instantly',
  description:
    'Trigger workflow from Instantly campaign events like replies received, opens, clicks, and bounces',
  version: '1.0.0',
  icon: InstantlyIcon,

  configFields: {},

  // Flattened by formatWebhookInput's instantly case
  outputs: {
    event_type: {
      type: 'string',
      description: 'Event type (reply_received, email_opened, link_clicked, email_bounced)',
    },
    campaign_id: { type: 'string', description: 'Campaign ID' },
    campaign_name: { type: 'string', description: 'Campaign name' },
    lead_email: { type: 'string', description: 'Lead email address' },
    lead_first_name: { type: 'string', description: 'Lead first name' },
    lead_last_name: { type: 'string', description: 'Lead last name' },
    lead_company: { type: 'string', description: 'Lead company name' },
    email_account: { type: 'string', description: 'Sending email account' },
    reply_text: { type: 'string', description: 'Reply body (reply events)' },
    reply_subject: { type: 'string', description: 'Reply subject' },
    timestamp: { type: 'string', description: 'When the event occurred' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to Instantly > Settings > Integrations > Webhooks.',
    'Add a webhook and paste the <strong>Webhook URL</strong> (from above).',
    'Select the campaign events you want (e.g. Reply Received).',
    'Instantly does not sign webhooks - treat the URL as the secret and do not share it.',
  ],

  samplePayload: {
    event_type: 'reply_received',
    campaign_id: 'camp_1',
    campaign_name: 'Q1 Outbound',
    lead_email: 'ada@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    companyName: 'Acme',
    reply_text: 'Sounds interesting',
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
