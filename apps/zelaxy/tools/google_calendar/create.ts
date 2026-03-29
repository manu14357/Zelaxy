import {
  CALENDAR_API_BASE,
  type GoogleCalendarApiEventResponse,
  type GoogleCalendarCreateParams,
  type GoogleCalendarCreateResponse,
  type GoogleCalendarEventRequestBody,
} from '@/tools/google_calendar/types'
import type { ToolConfig } from '@/tools/types'

export const createTool: ToolConfig<GoogleCalendarCreateParams, GoogleCalendarCreateResponse> = {
  id: 'google_calendar_create',
  name: 'Google Calendar Create Event',
  description: 'Create a new event in Google Calendar',
  version: '1.0.0',

  oauth: {
    required: true,
    provider: 'google-calendar',
    additionalScopes: ['https://www.googleapis.com/auth/calendar'],
  },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'Access token for Google Calendar API',
    },
    calendarId: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Calendar ID (defaults to primary)',
    },
    summary: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Event title/summary',
    },
    description: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Event description',
    },
    location: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Event location',
    },
    startDateTime: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description:
        'Start date and time (RFC3339 format, e.g., 2025-06-03T10:00:00-08:00 or 2025-06-03T18:00:00Z)',
    },
    endDateTime: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description:
        'End date and time (RFC3339 format, e.g., 2025-06-03T11:00:00-08:00 or 2025-06-03T19:00:00Z)',
    },
    timeZone: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Time zone (e.g., America/Los_Angeles)',
    },
    attendees: {
      type: 'array',
      required: false,
      visibility: 'user-or-llm',
      description: 'Array of attendee email addresses',
    },
    sendUpdates: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'How to send updates to attendees: all, externalOnly, or none',
    },
  },

  request: {
    url: (params: GoogleCalendarCreateParams) => {
      const calendarId = params.calendarId || 'primary'
      const queryParams = new URLSearchParams()

      if (params.sendUpdates !== undefined) {
        queryParams.append('sendUpdates', params.sendUpdates)
      }

      const queryString = queryParams.toString()
      const finalUrl = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events${queryString ? `?${queryString}` : ''}`

      // Debug logging
      console.log('Google Calendar Create URL:', finalUrl)
      console.log('Calendar ID:', calendarId)
      console.log('Send Updates:', params.sendUpdates)

      return finalUrl
    },
    method: 'POST',
    headers: (params: GoogleCalendarCreateParams) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: (params: GoogleCalendarCreateParams): GoogleCalendarEventRequestBody => {
      // Normalize date format for Google Calendar API
      const normalizeDateTime = (dateTime: string): string => {
        try {
          // First, trim any whitespace
          const trimmedDateTime = dateTime.trim()

          // Then validate that it's a valid date
          const date = new Date(trimmedDateTime)
          if (Number.isNaN(date.getTime())) {
            throw new Error(`Invalid date: ${trimmedDateTime}`)
          }

          // Debug logging for timezone handling
          console.log('Original dateTime:', trimmedDateTime)

          // If the date ends with 'Z', convert it to a proper timezone offset
          if (trimmedDateTime.endsWith('Z')) {
            // Convert Z to UTC+0 format for better compatibility
            const normalizedDate = trimmedDateTime.replace('Z', '+00:00')
            console.log('Normalized Z to UTC offset:', normalizedDate)
            return normalizedDate
          }

          // Ensure the date has a timezone offset
          if (!/[+-]\d{2}:\d{2}$/.test(trimmedDateTime)) {
            // If no timezone offset is present, assume UTC
            const utcDate = `${trimmedDateTime}+00:00`
            console.log('Added UTC offset to date without timezone:', utcDate)
            return utcDate
          }

          console.log('Date already has timezone, using as-is:', trimmedDateTime)
          return trimmedDateTime
        } catch (error) {
          console.error('Date normalization error:', error)
          // Fallback: return trimmed original date
          return dateTime.trim()
        }
      }

      const eventData: GoogleCalendarEventRequestBody = {
        summary: params.summary.trim(),
        start: {
          dateTime: normalizeDateTime(params.startDateTime),
        },
        end: {
          dateTime: normalizeDateTime(params.endDateTime),
        },
      }

      if (params.description?.trim()) {
        eventData.description = params.description.trim()
      }

      if (params.location?.trim()) {
        eventData.location = params.location.trim()
      }

      if (params.timeZone) {
        eventData.start.timeZone = params.timeZone
        eventData.end.timeZone = params.timeZone
      }

      // Handle both string and array cases for attendees
      let attendeeList: string[] = []
      if (params.attendees) {
        const attendees = params.attendees as string | string[]
        if (Array.isArray(attendees)) {
          attendeeList = attendees.filter((email: string) => email && email.trim().length > 0)
        } else if (typeof attendees === 'string' && attendees.trim().length > 0) {
          // Convert comma-separated string to array
          attendeeList = attendees
            .split(',')
            .map((email: string) => email.trim())
            .filter((email: string) => email.length > 0)
        }
      }

      if (attendeeList.length > 0) {
        eventData.attendees = attendeeList.map((email: string) => ({ email }))
      }

      // Debug logging
      console.log('Google Calendar Create Request Body:', JSON.stringify(eventData, null, 2))

      return eventData
    },
  },

  transformResponse: async (response: Response) => {
    const data: GoogleCalendarApiEventResponse = await response.json()

    return {
      success: true,
      output: {
        content: `Event "${data.summary}" created successfully`,
        metadata: {
          id: data.id,
          htmlLink: data.htmlLink,
          status: data.status,
          summary: data.summary,
          description: data.description,
          location: data.location,
          start: data.start,
          end: data.end,
          attendees: data.attendees,
          creator: data.creator,
          organizer: data.organizer,
        },
      },
    }
  },

  outputs: {
    content: { type: 'string', description: 'Event creation confirmation message' },
    metadata: {
      type: 'json',
      description: 'Created event metadata including ID, status, and details',
    },
  },
}
