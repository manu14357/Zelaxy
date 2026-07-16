import { GreenhouseIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const greenhouseWebhookTrigger: TriggerConfig = {
  id: 'greenhouse_webhook',
  name: 'Greenhouse Webhook',
  provider: 'greenhouse',
  description:
    'Trigger workflow from Greenhouse events like candidates being hired, rejected, or changing stage',
  version: '1.0.0',
  icon: GreenhouseIcon,

  configFields: {
    secretKey: {
      type: 'string',
      label: 'Secret Key (Recommended)',
      placeholder: 'Enter the value configured in the provider',
      description:
        'The secret key you set on the Greenhouse web hook. Validates the Signature header on every delivery.',
      required: false,
      isSecret: true,
    },
  },

  // Flattened by formatWebhookInput's greenhouse case
  outputs: {
    event_type: {
      type: 'string',
      description: 'Event type (candidate_hired, candidate_stage_change, application_updated)',
    },
    candidate_id: { type: 'number', description: 'Candidate ID' },
    candidate_name: { type: 'string', description: 'Candidate full name' },
    candidate_email: { type: 'string', description: 'Candidate primary email address' },
    application_id: { type: 'number', description: 'Application ID' },
    job_id: { type: 'number', description: 'Job ID' },
    job_name: { type: 'string', description: 'Job name' },
    stage: { type: 'string', description: 'Current stage name' },
    status: { type: 'string', description: 'Application status' },
    payload: { type: 'object', description: 'Full payload object as sent by Greenhouse' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to Greenhouse > Configure > Dev Center > Web Hooks.',
    'Create a new web hook.',
    'Paste the <strong>Webhook URL</strong> (from above) into the "Endpoint URL" field.',
    'Choose the event you want (e.g. Candidate has been hired).',
    'Enter a <strong>Secret Key</strong> and copy the same value into the field above.',
  ],

  samplePayload: {
    action: 'candidate_hired',
    payload: {
      application: {
        id: 123,
        status: 'hired',
        candidate: {
          id: 456,
          first_name: 'Ada',
          last_name: 'Lovelace',
        },
        jobs: [
          {
            id: 789,
            name: 'Staff Engineer',
          },
        ],
        current_stage: {
          name: 'Offer',
        },
      },
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Signature: 'sha256 <hmac-hex>',
    },
  },
}
