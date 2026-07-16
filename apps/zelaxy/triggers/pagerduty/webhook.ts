import { PagerDutyIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const pagerdutyWebhookTrigger: TriggerConfig = {
  id: 'pagerduty_webhook',
  name: 'PagerDuty Webhook',
  provider: 'pagerduty',
  description:
    'Trigger workflow from PagerDuty incidents when they are triggered, acknowledged, escalated, reassigned, or resolved',
  version: '1.0.0',
  icon: PagerDutyIcon,

  configFields: {
    webhookSecret: {
      type: 'string',
      label: 'Webhook Secret (Recommended)',
      placeholder: 'Shown once when the webhook subscription is created',
      description:
        'PagerDuty shows this when you add the subscription. Deliveries whose X-PagerDuty-Signature does not match are rejected.',
      required: false,
      isSecret: true,
    },
  },

  // Flattened by formatWebhookInput's pagerduty case
  outputs: {
    event_type: {
      type: 'string',
      description:
        'Event type (incident.triggered, incident.acknowledged, incident.escalated, incident.reassigned, incident.resolved)',
    },
    event_id: { type: 'string', description: 'Unique ID of the webhook event' },
    occurred_at: { type: 'string', description: 'When the event occurred' },
    incident_id: { type: 'string', description: 'Incident ID' },
    incident_number: { type: 'number', description: 'Human-facing incident number' },
    title: { type: 'string', description: 'Incident title' },
    status: { type: 'string', description: 'Incident status (triggered, acknowledged, resolved)' },
    urgency: { type: 'string', description: 'Incident urgency (high, low)' },
    priority: { type: 'string', description: 'Incident priority summary, when set' },
    html_url: { type: 'string', description: 'Link to the incident in PagerDuty' },
    created_at: { type: 'string', description: 'When the incident was created' },
    service_id: { type: 'string', description: 'ID of the affected service' },
    service_name: { type: 'string', description: 'Name of the affected service' },
    escalation_policy: { type: 'string', description: 'Escalation policy name, when present' },
    assignees: { type: 'array', description: 'Users currently assigned to the incident' },
    assignee_names: { type: 'array', description: 'Names of the assigned users' },
    agent_name: { type: 'string', description: 'Who performed the action, when present' },
    incident: { type: 'object', description: 'Full incident object as sent by PagerDuty' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to PagerDuty > Integrations > Generic Webhooks (v3).',
    'Click "New Webhook".',
    'Paste the <strong>Webhook URL</strong> (from above) into the "Webhook URL" field.',
    'Set the scope to the service or account you want to watch.',
    'Under "Event Subscription", select the incident events you want (e.g., incident.triggered, incident.resolved).',
    'Click "Add Webhook", then copy the <strong>secret</strong> shown once into the field above so deliveries can be verified.',
  ],

  samplePayload: {
    event: {
      id: '01DPXQZG4Z3ZBQ0N2T0Q9W8XYZ',
      event_type: 'incident.triggered',
      resource_type: 'incident',
      occurred_at: '2024-01-15T13:14:15.000Z',
      agent: { id: 'PXXXXXX', type: 'user_reference', summary: 'Ada Lovelace' },
      data: {
        id: 'PABCDEF',
        type: 'incident',
        number: 1234,
        title: 'Checkout API returning 500s',
        status: 'triggered',
        urgency: 'high',
        created_at: '2024-01-15T13:14:15Z',
        html_url: 'https://acme.pagerduty.com/incidents/PABCDEF',
        service: { id: 'PSVC123', summary: 'Checkout API' },
        assignees: [{ id: 'PXXXXXX', summary: 'Ada Lovelace' }],
        escalation_policy: { id: 'PEP123', summary: 'Primary On-Call' },
      },
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-PagerDuty-Signature': 'v1=<hmac-sha256-hex>',
    },
  },
}
