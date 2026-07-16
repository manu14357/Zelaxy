import { RootlyIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const rootlyWebhookTrigger: TriggerConfig = {
  id: 'rootly_webhook',
  name: 'Rootly Webhook',
  provider: 'rootly',
  description:
    'Trigger workflow from Rootly events like incidents being created, mitigated, or resolved',
  version: '1.0.0',
  icon: RootlyIcon,

  configFields: {
    signingSecret: {
      type: 'string',
      label: 'Signing Secret (Recommended)',
      placeholder: 'Enter the value configured in the provider',
      description:
        'Shown on the Rootly webhook endpoint. Validates the X-Rootly-Signature header on every delivery.',
      required: false,
      isSecret: true,
    },
  },

  // Flattened by formatWebhookInput's rootly case
  outputs: {
    event_type: {
      type: 'string',
      description: 'Event type (incident.created, incident.updated, incident.resolved)',
    },
    incident_id: { type: 'string', description: 'Incident ID' },
    incident_title: { type: 'string', description: 'Incident title' },
    incident_status: { type: 'string', description: 'Incident status' },
    severity: { type: 'string', description: 'Incident severity' },
    summary: { type: 'string', description: 'Incident summary' },
    url: { type: 'string', description: 'Link to the incident in Rootly' },
    created_at: { type: 'string', description: 'When the incident was created' },
    data: { type: 'object', description: 'Full data object as sent by Rootly' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to Rootly > Settings > Integrations > Webhooks.',
    'Create a new webhook endpoint.',
    'Paste the <strong>Webhook URL</strong> (from above) into the URL field.',
    'Select the events you want (e.g. incident.created).',
    'Save, then copy the <strong>Signing Secret</strong> into the field above.',
  ],

  samplePayload: {
    event: 'incident.created',
    data: {
      id: 'inc_1',
      attributes: {
        title: 'Checkout degraded',
        status: 'started',
        url: 'https://rootly.com/incidents/inc_1',
        created_at: '2024-01-15T13:14:15Z',
      },
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Rootly-Signature': '<hmac-sha256-hex>',
    },
  },
}
