import type { ToolConfig } from '@/tools/types'

export const calcomListBookingsTool: ToolConfig = {
  id: 'calcom_list_bookings',
  name: 'Cal.com List Bookings',
  description: 'List all bookings with optional status filter.',
  version: '1.0.0',

  oauth: { required: true, provider: 'calcom' },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'Cal.com OAuth access token',
    },
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by status: upcoming, recurring, past, cancelled, or unconfirmed',
    },
    take: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of bookings to return',
    },
    skip: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of bookings to skip',
    },
  },

  request: {
    url: (params) => {
      const queryParams: string[] = []
      if (params.status) queryParams.push(`status=${encodeURIComponent(params.status)}`)
      if (params.take !== undefined) queryParams.push(`take=${params.take}`)
      if (params.skip !== undefined) queryParams.push(`skip=${params.skip}`)
      const base = 'https://api.cal.com/v2/bookings'
      return queryParams.length > 0 ? `${base}?${queryParams.join('&')}` : base
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
      'cal-api-version': '2024-08-13',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return { success: true, output: data }
  },

  outputs: {
    status: { type: 'string', description: 'Response status' },
    data: { type: 'array', description: 'Array of bookings' },
  },
}

export const calcomCreateBookingTool: ToolConfig = {
  id: 'calcom_create_booking',
  name: 'Cal.com Create Booking',
  description: 'Create a new booking on Cal.com.',
  version: '1.0.0',

  oauth: { required: true, provider: 'calcom' },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'Cal.com OAuth access token',
    },
    eventTypeId: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the event type to book',
    },
    start: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start time in UTC ISO 8601 format',
    },
    attendee: {
      type: 'object',
      required: true,
      visibility: 'hidden',
      description: 'Attendee information object with name, email, timeZone',
    },
    guests: {
      type: 'array',
      required: false,
      visibility: 'user-or-llm',
      description: 'Array of guest email addresses',
    },
    lengthInMinutes: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Duration override in minutes',
    },
    metadata: {
      type: 'object',
      required: false,
      visibility: 'user-or-llm',
      description: 'Custom metadata',
    },
  },

  request: {
    url: 'https://api.cal.com/v2/bookings',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
      'cal-api-version': '2024-08-13',
    }),
    body: (params) => {
      const body: Record<string, unknown> = {
        eventTypeId: params.eventTypeId,
        start: params.start,
        attendee: params.attendee,
      }
      if (params.guests && (params.guests as unknown[]).length > 0) body.guests = params.guests
      if (params.lengthInMinutes !== undefined) body.lengthInMinutes = params.lengthInMinutes
      if (params.metadata) body.metadata = params.metadata
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(
        data.error?.message || data.message || `Request failed with status ${response.status}`
      )
    }
    return { success: true, output: data }
  },

  outputs: {
    status: { type: 'string', description: 'Response status' },
    data: { type: 'object', description: 'Created booking details' },
  },
}

export const calcomGetBookingTool: ToolConfig = {
  id: 'calcom_get_booking',
  name: 'Cal.com Get Booking',
  description: 'Get details of a specific booking by its UID.',
  version: '1.0.0',

  oauth: { required: true, provider: 'calcom' },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'Cal.com OAuth access token',
    },
    bookingUid: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Unique identifier (UID) of the booking',
    },
  },

  request: {
    url: (params) => `https://api.cal.com/v2/bookings/${encodeURIComponent(params.bookingUid)}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
      'cal-api-version': '2024-08-13',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return { success: true, output: data }
  },

  outputs: {
    status: { type: 'string', description: 'Response status' },
    data: { type: 'object', description: 'Booking details' },
  },
}

export const calcomCancelBookingTool: ToolConfig = {
  id: 'calcom_cancel_booking',
  name: 'Cal.com Cancel Booking',
  description: 'Cancel an existing booking.',
  version: '1.0.0',

  oauth: { required: true, provider: 'calcom' },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'Cal.com OAuth access token',
    },
    bookingUid: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Unique identifier (UID) of the booking to cancel',
    },
    cancellationReason: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Reason for cancelling',
    },
  },

  request: {
    url: (params) =>
      `https://api.cal.com/v2/bookings/${encodeURIComponent(params.bookingUid)}/cancel`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
      'cal-api-version': '2024-08-13',
    }),
    body: (params) => {
      const body: Record<string, unknown> = {}
      if (params.cancellationReason) body.cancellationReason = params.cancellationReason
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return { success: true, output: data }
  },

  outputs: {
    status: { type: 'string', description: 'Response status' },
    data: { type: 'object', description: 'Cancelled booking details' },
  },
}

export const calcomGetSlotsTool: ToolConfig = {
  id: 'calcom_get_slots',
  name: 'Cal.com Get Slots',
  description: 'Get available booking slots for a Cal.com event type within a time range.',
  version: '1.0.0',

  oauth: { required: true, provider: 'calcom' },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'Cal.com OAuth access token',
    },
    start: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start of time range in UTC ISO 8601 format',
    },
    end: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'End of time range in UTC ISO 8601 format',
    },
    eventTypeId: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Event type ID',
    },
    eventTypeSlug: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Event type slug',
    },
    username: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Username for personal event types',
    },
    timeZone: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Timezone for returned slots',
    },
    duration: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Slot length in minutes',
    },
  },

  request: {
    url: (params) => {
      const queryParams: string[] = []
      queryParams.push(`start=${encodeURIComponent(params.start)}`)
      queryParams.push(`end=${encodeURIComponent(params.end)}`)
      if (
        params.eventTypeId !== undefined &&
        params.eventTypeId !== null &&
        String(params.eventTypeId) !== ''
      ) {
        queryParams.push(`eventTypeId=${params.eventTypeId}`)
      }
      if (params.eventTypeSlug)
        queryParams.push(`eventTypeSlug=${encodeURIComponent(params.eventTypeSlug)}`)
      if (params.username) queryParams.push(`username=${encodeURIComponent(params.username)}`)
      if (params.timeZone) queryParams.push(`timeZone=${encodeURIComponent(params.timeZone)}`)
      if (
        params.duration !== undefined &&
        params.duration !== null &&
        String(params.duration) !== ''
      ) {
        queryParams.push(`duration=${params.duration}`)
      }
      return `https://api.cal.com/v2/slots?${queryParams.join('&')}`
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
      'cal-api-version': '2024-09-04',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(
        data.error?.message || data.message || `Request failed with status ${response.status}`
      )
    }
    return { success: true, output: data }
  },

  outputs: {
    status: { type: 'string', description: 'Response status' },
    data: { type: 'json', description: 'Available time slots grouped by date' },
  },
}

export const calcomListEventTypesTool: ToolConfig = {
  id: 'calcom_list_event_types',
  name: 'Cal.com List Event Types',
  description: 'Retrieve a list of all event types.',
  version: '1.0.0',

  oauth: { required: true, provider: 'calcom' },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'Cal.com OAuth access token',
    },
    sortCreatedAt: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort by creation date: "asc" or "desc"',
    },
  },

  request: {
    url: (params) => {
      const queryParams: string[] = []
      if (params.sortCreatedAt)
        queryParams.push(`sortCreatedAt=${encodeURIComponent(params.sortCreatedAt)}`)
      const base = 'https://api.cal.com/v2/event-types'
      return queryParams.length > 0 ? `${base}?${queryParams.join('&')}` : base
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
      'cal-api-version': '2024-06-14',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return { success: true, output: data }
  },

  outputs: {
    status: { type: 'string', description: 'Response status' },
    data: { type: 'array', description: 'Array of event types' },
  },
}
