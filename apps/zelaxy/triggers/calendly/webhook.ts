import { CalendarIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const calendlyWebhookTrigger: TriggerConfig = {
  id: 'calendly_webhook',
  name: 'Calendly Webhook',
  provider: 'calendly',
  description:
    'Trigger workflow when a Calendly invitee books or cancels a meeting, or submits a routing form',
  version: '1.0.0',
  icon: CalendarIcon,

  configFields: {
    signingKey: {
      type: 'string',
      label: 'Webhook Signing Key (Recommended)',
      placeholder: 'Returned when the subscription is created',
      description:
        'Calendly returns this when you create the webhook subscription. Deliveries whose Calendly-Webhook-Signature does not match are rejected.',
      required: false,
      isSecret: true,
    },
  },

  // Flattened by formatWebhookInput's calendly case
  outputs: {
    event: {
      type: 'string',
      description:
        'Event that occurred (invitee.created, invitee.canceled, routing_form_submission.created)',
    },
    invitee_name: { type: 'string', description: 'Invitee full name' },
    invitee_email: { type: 'string', description: 'Invitee email address' },
    invitee_timezone: { type: 'string', description: 'Invitee timezone' },
    invitee_status: { type: 'string', description: 'Invitee status (active, canceled)' },
    invitee_uri: { type: 'string', description: 'Calendly URI for the invitee' },
    reschedule_url: { type: 'string', description: 'URL the invitee can use to reschedule' },
    cancel_url: { type: 'string', description: 'URL the invitee can use to cancel' },
    rescheduled: { type: 'boolean', description: 'Whether this booking was rescheduled' },
    event_name: { type: 'string', description: 'Name of the scheduled event' },
    event_uri: { type: 'string', description: 'Calendly URI for the scheduled event' },
    event_status: { type: 'string', description: 'Scheduled event status (active, canceled)' },
    start_time: { type: 'string', description: 'Scheduled event start time' },
    end_time: { type: 'string', description: 'Scheduled event end time' },
    location: { type: 'object', description: 'Where the meeting takes place' },
    join_url: { type: 'string', description: 'Conferencing join URL, when available' },
    cancellation: {
      type: 'object',
      description: 'Cancellation details for invitee.canceled events (reason, who canceled)',
    },
    cancel_reason: { type: 'string', description: 'Reason given for the cancellation' },
    questions_and_answers: {
      type: 'array',
      description: 'Answers the invitee gave to booking questions',
    },
    answers: {
      type: 'object',
      description: 'Booking answers keyed by question text, for direct access',
    },
    tracking: { type: 'object', description: 'UTM and Salesforce tracking parameters' },
    payload: { type: 'object', description: 'Full payload object as sent by Calendly' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Calendly webhooks are created through its API, not the dashboard — get a Personal Access Token from Calendly > Integrations > API & Webhooks.',
    'Find your user/organization URI with <code>GET https://api.calendly.com/users/me</code>.',
    'Create the subscription with <code>POST https://api.calendly.com/webhook_subscriptions</code>.',
    'Set <code>url</code> to the <strong>Webhook URL</strong> (from above) and <code>events</code> to what you want (e.g. <code>["invitee.created","invitee.canceled"]</code>).',
    'Set <code>scope</code> to <code>"user"</code> or <code>"organization"</code>, including the matching URI.',
    'Copy the <strong>signing_key</strong> from the API response into the field above so deliveries can be verified.',
  ],

  samplePayload: {
    event: 'invitee.created',
    created_at: '2024-01-15T13:14:15.000000Z',
    payload: {
      email: 'ada@example.com',
      name: 'Ada Lovelace',
      status: 'active',
      timezone: 'America/New_York',
      uri: 'https://api.calendly.com/scheduled_events/BBBB/invitees/CCCC',
      reschedule_url: 'https://calendly.com/reschedulings/CCCC',
      cancel_url: 'https://calendly.com/cancellations/CCCC',
      rescheduled: false,
      questions_and_answers: [
        {
          question: 'What would you like to discuss?',
          answer: 'Pricing for the enterprise plan',
          position: 0,
        },
      ],
      scheduled_event: {
        uri: 'https://api.calendly.com/scheduled_events/BBBB',
        name: '30 Minute Meeting',
        status: 'active',
        start_time: '2024-01-20T15:00:00.000000Z',
        end_time: '2024-01-20T15:30:00.000000Z',
        location: { type: 'google_conference', join_url: 'https://meet.google.com/abc-defg-hij' },
      },
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Calendly-Webhook-Signature': 't=1705324455,v1=<hmac-sha256-hex>',
    },
  },
}
