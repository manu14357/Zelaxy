import { ChartBarIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const fathomWebhookTrigger: TriggerConfig = {
  id: 'fathom_webhook',
  name: 'Fathom Webhook',
  provider: 'fathom',
  description:
    'Trigger workflow when a Fathom meeting recording, summary, or transcript becomes available',
  version: '1.0.0',
  icon: ChartBarIcon,

  configFields: {},

  // Flattened by formatWebhookInput's fathom case
  outputs: {
    event_type: { type: 'string', description: 'Event type reported by Fathom' },
    meeting_id: { type: 'string', description: 'Meeting ID' },
    meeting_title: { type: 'string', description: 'Meeting title' },
    recording_url: { type: 'string', description: 'Link to the recording' },
    share_url: { type: 'string', description: 'Shareable link' },
    scheduled_start_time: {
      type: 'string',
      description: 'When the meeting was scheduled to start',
    },
    summary: { type: 'string', description: 'AI summary, when available' },
    transcript: { type: 'string', description: 'Transcript, when available' },
    invitees: { type: 'array', description: 'Meeting invitees' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to Fathom > Settings > Integrations and create a webhook.',
    'Paste the <strong>Webhook URL</strong> (from above) as the target.',
    'Choose when it fires (e.g. after a meeting is processed).',
    'Fathom does not sign webhooks - treat the URL as the secret and do not share it.',
  ],

  samplePayload: {
    id: 'meet_1',
    title: 'Acme intro call',
    recording_url: 'https://fathom.video/calls/1',
    share_url: 'https://fathom.video/share/abc',
    scheduled_start_time: '2024-01-15T13:00:00Z',
    summary: 'Discussed pricing and rollout.',
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
