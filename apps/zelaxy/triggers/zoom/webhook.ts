import { ZoomIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const zoomWebhookTrigger: TriggerConfig = {
  id: 'zoom_webhook',
  name: 'Zoom Webhook',
  provider: 'zoom',
  description:
    'Trigger workflow from Zoom events like meetings starting or ending, participants joining or leaving, and recordings completing',
  version: '1.0.0',
  icon: ZoomIcon,

  configFields: {
    secretToken: {
      type: 'string',
      label: 'Secret Token (Required)',
      placeholder: 'From your Zoom app credentials',
      description:
        'Zoom requires this to validate the endpoint before the webhook can be enabled, and it verifies every delivery.',
      required: true,
      isSecret: true,
    },
  },

  // Flattened by formatWebhookInput's zoom case
  outputs: {
    event_type: {
      type: 'string',
      description:
        'Event type (meeting.started, meeting.ended, meeting.participant_joined, recording.completed, ...)',
    },
    event_ts: { type: 'number', description: 'Event timestamp (epoch ms)' },
    account_id: { type: 'string', description: 'Zoom account ID' },
    meeting_id: { type: 'string', description: 'Meeting ID' },
    meeting_uuid: { type: 'string', description: 'Meeting UUID (unique per occurrence)' },
    topic: { type: 'string', description: 'Meeting topic' },
    host_id: { type: 'string', description: 'Meeting host ID' },
    start_time: { type: 'string', description: 'Meeting start time' },
    end_time: { type: 'string', description: 'Meeting end time' },
    duration: { type: 'number', description: 'Meeting duration in minutes' },
    join_url: { type: 'string', description: 'Meeting join URL' },
    participant_name: { type: 'string', description: 'Participant name (participant events)' },
    participant_email: { type: 'string', description: 'Participant email (participant events)' },
    participant_id: { type: 'string', description: 'Participant user ID' },
    join_time: { type: 'string', description: 'When the participant joined' },
    leave_time: { type: 'string', description: 'When the participant left' },
    recording_files: { type: 'array', description: 'Recording files (recording.completed)' },
    share_url: { type: 'string', description: 'Recording share URL' },
    object: { type: 'object', description: 'Full object as sent by Zoom' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to the <a href="https://marketplace.zoom.us/" target="_blank" rel="noopener noreferrer">Zoom App Marketplace</a> > Develop > Build App, and create a "General App".',
    'Open the "Access" (or "Feature") tab and enable Event Subscriptions.',
    'Add a subscription and paste the <strong>Webhook URL</strong> (from above) as the Event notification endpoint URL.',
    "Copy the app's <strong>Secret Token</strong> into the field above <em>before</em> clicking Validate — Zoom validates the endpoint by calling it, and the check fails without the token.",
    'Click "Validate", then add the events you want (e.g. Meeting Started, Meeting Ended, Recording Completed).',
    'Save and activate the app.',
  ],

  samplePayload: {
    event: 'meeting.started',
    event_ts: 1705324455000,
    payload: {
      account_id: 'abc123',
      object: {
        id: '81234567890',
        uuid: 'aBcDeFgHiJk==',
        topic: 'Weekly Standup',
        host_id: 'xyz789',
        type: 2,
        start_time: '2024-01-15T13:00:00Z',
        duration: 30,
        timezone: 'America/New_York',
      },
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-zm-signature': 'v0=<hmac-sha256-hex>',
      'x-zm-request-timestamp': '1705324455',
    },
  },
}
