import { UsersIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const ashbyWebhookTrigger: TriggerConfig = {
  id: 'ashby_webhook',
  name: 'Ashby Webhook',
  provider: 'ashby',
  description:
    'Trigger workflow from Ashby events like applications being submitted or candidates changing stage',
  version: '1.0.0',
  icon: UsersIcon,

  configFields: {
    secretToken: {
      type: 'string',
      label: 'Secret Token (Recommended)',
      placeholder: 'Enter the value configured in the provider',
      description:
        'Shown when you create the Ashby webhook. Validates the Ashby-Signature header on every delivery.',
      required: false,
      isSecret: true,
    },
  },

  // Flattened by formatWebhookInput's ashby case
  outputs: {
    event_type: {
      type: 'string',
      description: 'Event type (applicationSubmit, candidateStageChange, candidateHire)',
    },
    candidate_id: { type: 'string', description: 'Candidate ID' },
    candidate_name: { type: 'string', description: 'Candidate name' },
    candidate_email: { type: 'string', description: 'Candidate primary email address' },
    application_id: { type: 'string', description: 'Application ID' },
    job_id: { type: 'string', description: 'Job ID' },
    job_title: { type: 'string', description: 'Job title' },
    stage: { type: 'string', description: 'Current interview stage' },
    status: { type: 'string', description: 'Application status' },
    data: { type: 'object', description: 'Full data object as sent by Ashby' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to Ashby > Admin > Integrations > API & Webhooks.',
    'Create a new webhook.',
    'Paste the <strong>Webhook URL</strong> (from above) into the endpoint field.',
    'Select the event you want (e.g. Application Submitted).',
    'Copy the <strong>Secret Token</strong> Ashby shows into the field above.',
  ],

  samplePayload: {
    action: 'applicationSubmit',
    data: {
      application: {
        id: 'app_1',
        status: 'Active',
        candidate: {
          id: 'cand_1',
          name: 'Ada Lovelace',
        },
        job: {
          id: 'job_1',
          title: 'Staff Engineer',
        },
      },
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
