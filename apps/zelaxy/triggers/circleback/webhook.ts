import { ConnectIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const circlebackWebhookTrigger: TriggerConfig = {
  id: 'circleback_webhook',
  name: 'Circleback Webhook',
  provider: 'circleback',
  description:
    'Trigger workflow when a Circleback meeting completes and its notes or action items are ready',
  version: '1.0.0',
  icon: ConnectIcon,

  configFields: {
    webhookSecret: {
      type: 'string',
      label: 'Webhook Secret (Recommended)',
      placeholder: 'Enter the value configured in the provider',
      description:
        'A secret you set on the Circleback webhook. Zelaxy requires it verbatim in the Authorization header.',
      required: false,
      isSecret: true,
    },
  },

  // Flattened by formatWebhookInput's circleback case
  outputs: {
    event_type: {
      type: 'string',
      description: 'Event type (meeting.completed, meeting.notes.ready)',
    },
    meeting_id: { type: 'string', description: 'Meeting ID' },
    meeting_name: { type: 'string', description: 'Meeting name' },
    meeting_url: { type: 'string', description: 'Link to the meeting in Circleback' },
    start_time: { type: 'string', description: 'Meeting start time' },
    end_time: { type: 'string', description: 'Meeting end time' },
    notes: { type: 'string', description: 'Meeting notes, when available' },
    action_items: { type: 'array', description: 'Action items extracted from the meeting' },
    attendees: { type: 'array', description: 'Meeting attendees' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to Circleback > Settings > Integrations > Webhooks.',
    'Add a webhook and paste the <strong>Webhook URL</strong> (from above).',
    'Set the Authorization header value and copy the same value into the field above.',
    'Select the meeting events you want.',
  ],

  samplePayload: {
    type: 'meeting.completed',
    meeting: {
      id: 'meet_1',
      name: 'Acme intro call',
      url: 'https://circleback.ai/meetings/1',
      startTime: '2024-01-15T13:00:00Z',
      notes: 'Discussed pricing.',
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: '<your-secret>',
    },
  },
}
