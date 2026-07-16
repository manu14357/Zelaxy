import { IncidentioIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const incidentioWebhookTrigger: TriggerConfig = {
  id: 'incidentio_webhook',
  name: 'incident.io Webhook',
  provider: 'incidentio',
  description:
    'Trigger workflow from incident.io events like incidents being created, updated, or resolved',
  version: '1.0.0',
  icon: IncidentioIcon,

  configFields: {
    signingSecret: {
      type: 'string',
      label: 'Signing Secret (Recommended)',
      placeholder: 'Enter the value configured in the provider',
      description:
        'Shown on the incident.io webhook. incident.io signs deliveries with Svix; mismatches are rejected.',
      required: false,
      isSecret: true,
    },
  },

  // Flattened by formatWebhookInput's incidentio case
  outputs: {
    event_type: {
      type: 'string',
      description: 'Event type (public_incident.incident_created_v2, ...)',
    },
    incident_id: { type: 'string', description: 'Incident ID' },
    incident_name: { type: 'string', description: 'Incident name' },
    incident_status: { type: 'string', description: 'Incident status' },
    severity: { type: 'string', description: 'Incident severity' },
    summary: { type: 'string', description: 'Incident summary' },
    permalink: { type: 'string', description: 'Link to the incident in incident.io' },
    reference: { type: 'string', description: 'Human-facing incident reference (e.g. INC-123)' },
    created_at: { type: 'string', description: 'When the incident was created' },
    data: { type: 'object', description: 'Full event data as sent by incident.io' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to incident.io > Settings > Webhooks.',
    'Click "Add webhook".',
    'Paste the <strong>Webhook URL</strong> (from above) into the URL field.',
    'Select the events you want (e.g. incident created, incident updated).',
    'Save, then copy the <strong>Signing Secret</strong> into the field above.',
  ],

  samplePayload: {
    event_type: 'public_incident.incident_created_v2',
    created_at: '2024-01-15T13:14:15Z',
    public_data: {
      id: '01ABC',
      name: 'Checkout degraded',
      reference: 'INC-123',
      permalink: 'https://app.incident.io/incidents/123',
      incident_status: {
        name: 'Investigating',
      },
      severity: {
        name: 'Major',
      },
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'svix-signature': 'v1,<base64-hmac>',
    },
  },
}
