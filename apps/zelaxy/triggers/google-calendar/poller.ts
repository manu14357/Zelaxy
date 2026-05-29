import { GoogleCalendarIcon } from '@/components/icons'
import type { TriggerConfig } from '@/triggers/types'

export const googleCalendarPollingTrigger: TriggerConfig = {
  id: 'google_calendar_poller',
  name: 'Google Calendar Trigger',
  provider: 'google-calendar',
  description:
    'Triggers when new events are created or updated in Google Calendar (requires Google credentials)',
  version: '1.0.0',
  icon: GoogleCalendarIcon,

  requiresCredentials: true,
  credentialProvider: 'google-calendar',

  configFields: {
    calendarId: {
      type: 'string',
      label: 'Calendar ID',
      placeholder: 'primary or calendar@example.com',
      description:
        'The calendar ID to monitor. Use "primary" for the main calendar, or enter a specific calendar email address.',
      defaultValue: 'primary',
      required: false,
    },
    eventTypes: {
      type: 'multiselect',
      label: 'Event Types',
      placeholder: 'Select event types to monitor',
      description: 'Which types of calendar changes to trigger on.',
      required: false,
      options: ['created', 'updated', 'cancelled'],
    },
  },

  outputs: {
    event: {
      id: {
        type: 'string',
        description: 'Google Calendar event ID',
      },
      summary: {
        type: 'string',
        description: 'Event title/summary',
      },
      event_description: {
        type: 'string',
        description: 'Event description',
      },
      location: {
        type: 'string',
        description: 'Event location',
      },
      status: {
        type: 'string',
        description: 'Event status (confirmed, tentative, cancelled)',
      },
      start: {
        dateTime: {
          type: 'string',
          description: 'Event start date and time (ISO 8601)',
        },
        date: {
          type: 'string',
          description: 'Event start date for all-day events (YYYY-MM-DD)',
        },
        timeZone: {
          type: 'string',
          description: 'Time zone of the start time',
        },
      },
      end: {
        dateTime: {
          type: 'string',
          description: 'Event end date and time (ISO 8601)',
        },
        date: {
          type: 'string',
          description: 'Event end date for all-day events (YYYY-MM-DD)',
        },
        timeZone: {
          type: 'string',
          description: 'Time zone of the end time',
        },
      },
      organizer: {
        email: {
          type: 'string',
          description: 'Organizer email address',
        },
        displayName: {
          type: 'string',
          description: 'Organizer display name',
        },
      },
      attendees: {
        type: 'json',
        description: 'Array of attendees with email, displayName, and responseStatus',
      },
      htmlLink: {
        type: 'string',
        description: 'Link to the event in Google Calendar',
      },
      created: {
        type: 'string',
        description: 'Event creation timestamp (ISO 8601)',
      },
      updated: {
        type: 'string',
        description: 'Event last update timestamp (ISO 8601)',
      },
      recurringEventId: {
        type: 'string',
        description: 'ID of the recurring event (if this is a recurring event instance)',
      },
      calendarId: {
        type: 'string',
        description: 'Calendar ID where the event belongs',
      },
    },
  },

  instructions: [
    'Click <strong>Connect Google Calendar</strong> to authorize access to your Google Calendar.',
    'Select the calendar to monitor using the <strong>Calendar ID</strong> field (use "primary" for your main calendar).',
    'Choose which event types to trigger on: created, updated, or cancelled.',
    'The trigger will poll your calendar for new or updated events on a regular schedule.',
  ],

  samplePayload: {
    kind: 'calendar#event',
    id: 'event123abc456def',
    status: 'confirmed',
    htmlLink: 'https://www.google.com/calendar/event?eid=...',
    created: '2024-01-15T09:00:00.000Z',
    updated: '2024-01-15T09:00:00.000Z',
    summary: 'Team Standup',
    description: 'Daily team standup meeting',
    location: 'Conference Room A',
    organizer: {
      email: 'organizer@example.com',
      displayName: 'Jane Smith',
    },
    start: {
      dateTime: '2024-01-16T09:00:00-08:00',
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: '2024-01-16T09:30:00-08:00',
      timeZone: 'America/Los_Angeles',
    },
    attendees: [
      { email: 'person1@example.com', responseStatus: 'accepted' },
      { email: 'person2@example.com', responseStatus: 'needsAction' },
    ],
    calendarId: 'primary',
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
