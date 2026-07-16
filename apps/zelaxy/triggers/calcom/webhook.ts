import { CalendarIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const calcomWebhookTrigger: TriggerConfig = {
  id: 'calcom_webhook',
  name: 'Cal.com Webhook',
  provider: 'calcom',
  description:
    'Trigger workflow from Cal.com events when a booking is created, rescheduled, cancelled, or a meeting ends',
  version: '1.0.0',
  icon: CalendarIcon,

  configFields: {
    webhookSecret: {
      type: 'string',
      label: 'Webhook Secret (Recommended)',
      placeholder: 'Set this when creating the webhook in Cal.com',
      description:
        'Cal.com signs each delivery with this. Requests whose x-cal-signature-256 does not match are rejected.',
      required: false,
      isSecret: true,
    },
  },

  // Flattened by formatWebhookInput's calcom case
  outputs: {
    event_type: {
      type: 'string',
      description:
        'Trigger event (BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED, MEETING_ENDED, ...)',
    },
    booking_id: { type: 'string', description: 'Booking ID' },
    uid: { type: 'string', description: 'Booking UID' },
    title: { type: 'string', description: 'Booking title' },
    event_type_name: { type: 'string', description: 'Name of the booked event type' },
    start_time: { type: 'string', description: 'Booking start time' },
    end_time: { type: 'string', description: 'Booking end time' },
    organizer_name: { type: 'string', description: 'Organizer name' },
    organizer_email: { type: 'string', description: 'Organizer email' },
    attendee_name: { type: 'string', description: 'Primary attendee name' },
    attendee_email: { type: 'string', description: 'Primary attendee email' },
    attendee_timezone: { type: 'string', description: 'Primary attendee timezone' },
    attendees: { type: 'array', description: 'All attendees on the booking' },
    location: { type: 'string', description: 'Booking location' },
    status: { type: 'string', description: 'Booking status' },
    cancellation_reason: { type: 'string', description: 'Reason given when cancelled' },
    meeting_url: { type: 'string', description: 'Video meeting URL, when available' },
    answers: {
      type: 'object',
      description: 'Booking question answers, unwrapped to plain values and keyed by question',
    },
    responses: { type: 'object', description: 'Raw responses object as sent by Cal.com' },
    payload: { type: 'object', description: 'Full payload object as sent by Cal.com' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to Cal.com > Settings > Developer > Webhooks.',
    'Click "New" to add a webhook.',
    'Paste the <strong>Webhook URL</strong> (from above) into the "Subscriber URL" field.',
    'Enter a <strong>Secret</strong> and copy the same value into the field above so deliveries can be verified.',
    'Select the event triggers you want (e.g. Booking Created, Booking Cancelled, Booking Rescheduled).',
    'Make sure the webhook is enabled, then use "Ping test" to confirm it reaches Zelaxy.',
  ],

  samplePayload: {
    triggerEvent: 'BOOKING_CREATED',
    createdAt: '2024-01-15T13:14:15.000Z',
    payload: {
      bookingId: 123456,
      uid: 'abc123xyz',
      title: '30 Min Meeting between Ada and Alan',
      startTime: '2024-01-20T15:00:00Z',
      endTime: '2024-01-20T15:30:00Z',
      status: 'ACCEPTED',
      type: '30-min-meeting',
      organizer: { name: 'Ada Lovelace', email: 'ada@example.com', timeZone: 'Europe/London' },
      attendees: [{ name: 'Alan Turing', email: 'alan@example.com', timeZone: 'Europe/London' }],
      responses: { name: { label: 'your_name', value: 'Alan Turing' } },
      location: 'Cal Video',
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cal-signature-256': '<hmac-sha256-hex>',
    },
  },
}
