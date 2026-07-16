import { LemlistIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const lemlistWebhookTrigger: TriggerConfig = {
  id: 'lemlist_webhook',
  name: 'lemlist Webhook',
  provider: 'lemlist',
  description:
    'Trigger workflow from lemlist campaign events like replies, opens, clicks, and bounces',
  version: '1.0.0',
  icon: LemlistIcon,

  configFields: {},

  // Flattened by formatWebhookInput's lemlist case
  outputs: {
    event_type: {
      type: 'string',
      description: 'Event type (emailsReplied, emailsOpened, emailsClicked, emailsBounced)',
    },
    campaign_id: { type: 'string', description: 'Campaign ID' },
    campaign_name: { type: 'string', description: 'Campaign name' },
    lead_email: { type: 'string', description: 'Lead email address' },
    lead_first_name: { type: 'string', description: 'Lead first name' },
    lead_last_name: { type: 'string', description: 'Lead last name' },
    lead_company: { type: 'string', description: 'Lead company name' },
    sequence_step: { type: 'number', description: 'Sequence step number' },
    text: { type: 'string', description: 'Reply text (reply events)' },
    created_at: { type: 'string', description: 'When the event occurred' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to lemlist > Settings > Integrations > Webhooks.',
    'Add a webhook and paste the <strong>Webhook URL</strong> (from above).',
    'Select the events you want (e.g. Replied).',
    'lemlist does not sign webhooks - treat the URL as the secret and do not share it.',
  ],

  samplePayload: {
    type: 'emailsReplied',
    campaignId: 'camp_1',
    campaignName: 'Q1 Outbound',
    leadEmail: 'ada@example.com',
    leadFirstName: 'Ada',
    sequenceStep: 2,
    text: 'Sounds good',
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
