import type { ToolConfig } from '@/tools/types'

const LUMA_BASE_URL = 'https://public-api.luma.com/v1'

function lumaHeaders(apiKey: string): Record<string, string> {
  return {
    'x-luma-api-key': apiKey,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}

function mapEvent(event: any) {
  return {
    id: event.api_id,
    name: event.name,
    startAt: event.start_at,
    endAt: event.end_at,
    timezone: event.timezone,
    durationInterval: event.duration_interval,
    createdAt: event.created_at,
    description: event.description,
    descriptionMd: event.description_md,
    coverUrl: event.cover_url,
    url: event.url,
    visibility: event.visibility,
    meetingUrl: event.meeting_url,
    geoAddressJson: event.geo_address_json,
    geoLatitude: event.geo_latitude,
    geoLongitude: event.geo_longitude,
    calendarId: event.calendar_api_id,
  }
}

function mapHost(host: any) {
  return {
    id: host.api_id,
    name: host.name,
    firstName: host.first_name,
    lastName: host.last_name,
    email: host.email,
    avatarUrl: host.avatar_url,
  }
}

function mapGuest(entry: any) {
  const g = entry.guest || entry
  return {
    id: g.api_id,
    email: g.user_email,
    name: g.user_name,
    firstName: g.user_first_name,
    lastName: g.user_last_name,
    approvalStatus: g.approval_status,
    registeredAt: g.registered_at,
    invitedAt: g.invited_at,
    joinedAt: g.joined_at,
    checkedInAt: g.checked_in_at,
    phoneNumber: g.phone_number,
  }
}

export const lumaGetEventTool: ToolConfig = {
  id: 'luma_get_event',
  name: 'Get Event',
  description: 'Get details of a Luma event',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Luma API key',
    },
    eventId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Event ID (evt-...)',
    },
  },
  request: {
    url: (params: any) => `${LUMA_BASE_URL}/event/get?id=${params.eventId.trim()}`,
    method: 'GET',
    headers: (params: any) => lumaHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Luma API error: ${response.status}`)
    return {
      success: true,
      output: {
        event: mapEvent(data.event),
        hosts: (data.hosts || []).map(mapHost),
      },
    }
  },
  outputs: {
    event: { type: 'json', description: 'Event details' },
    hosts: { type: 'json', description: 'Event hosts' },
  },
}

export const lumaCreateEventTool: ToolConfig = {
  id: 'luma_create_event',
  name: 'Create Event',
  description: 'Create a new Luma event',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Luma API key',
    },
    name: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Event name',
    },
    start_at: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start time (ISO 8601)',
    },
    timezone: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Timezone (e.g. America/New_York)',
    },
    end_at: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'End time (ISO 8601)',
    },
    duration_interval: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Duration interval (e.g. 1h30m)',
    },
    description_md: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Event description in Markdown',
    },
    meeting_url: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Meeting URL for virtual events',
    },
    visibility: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Event visibility (public or private)',
    },
    cover_url: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'URL for the event cover image',
    },
  },
  request: {
    url: () => `${LUMA_BASE_URL}/event/create`,
    method: 'POST',
    headers: (params: any) => lumaHeaders(params.apiKey),
    body: (params: any) => {
      const body: any = {
        name: params.name,
        start_at: params.start_at,
        timezone: params.timezone,
      }
      if (params.end_at) body.end_at = params.end_at
      if (params.duration_interval) body.duration_interval = params.duration_interval
      if (params.description_md) body.description_md = params.description_md
      if (params.meeting_url) body.meeting_url = params.meeting_url
      if (params.visibility) body.visibility = params.visibility
      if (params.cover_url) body.cover_url = params.cover_url
      return body
    },
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Luma API error: ${response.status}`)
    return {
      success: true,
      output: {
        event: mapEvent(data.event),
        hosts: (data.hosts || []).map(mapHost),
      },
    }
  },
  outputs: {
    event: { type: 'json', description: 'Created event details' },
    hosts: { type: 'json', description: 'Event hosts' },
  },
}

export const lumaUpdateEventTool: ToolConfig = {
  id: 'luma_update_event',
  name: 'Update Event',
  description: 'Update an existing Luma event',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Luma API key',
    },
    eventId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Event ID to update',
    },
    name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Event name',
    },
    start_at: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Start time (ISO 8601)',
    },
    timezone: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Timezone',
    },
    end_at: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'End time (ISO 8601)',
    },
    duration_interval: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Duration interval',
    },
    description_md: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Event description in Markdown',
    },
    meeting_url: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Meeting URL',
    },
    visibility: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Event visibility',
    },
    cover_url: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Cover image URL',
    },
  },
  request: {
    url: () => `${LUMA_BASE_URL}/event/update`,
    method: 'POST',
    headers: (params: any) => lumaHeaders(params.apiKey),
    body: (params: any) => {
      const body: any = { id: params.eventId.trim() }
      if (params.name) body.name = params.name
      if (params.start_at) body.start_at = params.start_at
      if (params.timezone) body.timezone = params.timezone
      if (params.end_at) body.end_at = params.end_at
      if (params.duration_interval) body.duration_interval = params.duration_interval
      if (params.description_md) body.description_md = params.description_md
      if (params.meeting_url) body.meeting_url = params.meeting_url
      if (params.visibility) body.visibility = params.visibility
      if (params.cover_url) body.cover_url = params.cover_url
      return body
    },
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Luma API error: ${response.status}`)
    return {
      success: true,
      output: {
        event: mapEvent(data.event),
        hosts: (data.hosts || []).map(mapHost),
      },
    }
  },
  outputs: {
    event: { type: 'json', description: 'Updated event details' },
    hosts: { type: 'json', description: 'Event hosts' },
  },
}

export const lumaListEventsTool: ToolConfig = {
  id: 'luma_list_events',
  name: 'List Events',
  description: 'List events from a Luma calendar',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Luma API key',
    },
    after: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter events after this date (ISO 8601)',
    },
    before: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter events before this date (ISO 8601)',
    },
    pagination_limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of events to return',
    },
    pagination_cursor: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination cursor',
    },
    sort_column: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Column to sort by',
    },
    sort_direction: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort direction (asc or desc)',
    },
  },
  request: {
    url: (params: any) => {
      const searchParams = new URLSearchParams()
      if (params.after) searchParams.set('after', params.after)
      if (params.before) searchParams.set('before', params.before)
      if (params.pagination_limit != null)
        searchParams.set('pagination_limit', String(params.pagination_limit))
      if (params.pagination_cursor) searchParams.set('pagination_cursor', params.pagination_cursor)
      if (params.sort_column) searchParams.set('sort_column', params.sort_column)
      if (params.sort_direction) searchParams.set('sort_direction', params.sort_direction)
      const query = searchParams.toString()
      return `${LUMA_BASE_URL}/calendar/list-events${query ? `?${query}` : ''}`
    },
    method: 'GET',
    headers: (params: any) => lumaHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Luma API error: ${response.status}`)
    return {
      success: true,
      output: {
        events: (data.entries || []).map((entry: any) => mapEvent(entry.event || entry)),
        hasMore: data.has_more,
        nextCursor: data.next_cursor,
      },
    }
  },
  outputs: {
    events: { type: 'json', description: 'List of events' },
    hasMore: { type: 'boolean', description: 'Whether there are more events' },
    nextCursor: { type: 'string', description: 'Cursor for next page' },
  },
}

export const lumaGetGuestsTool: ToolConfig = {
  id: 'luma_get_guests',
  name: 'Get Guests',
  description: 'Get guest list for a Luma event',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Luma API key',
    },
    eventId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Event ID',
    },
    approval_status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by approval status (approved, pending, declined)',
    },
    pagination_limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of guests to return',
    },
    pagination_cursor: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination cursor',
    },
    sort_column: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Column to sort by',
    },
    sort_direction: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort direction (asc or desc)',
    },
  },
  request: {
    url: (params: any) => {
      const searchParams = new URLSearchParams()
      searchParams.set('event_id', params.eventId)
      if (params.approval_status) searchParams.set('approval_status', params.approval_status)
      if (params.pagination_limit != null)
        searchParams.set('pagination_limit', String(params.pagination_limit))
      if (params.pagination_cursor) searchParams.set('pagination_cursor', params.pagination_cursor)
      if (params.sort_column) searchParams.set('sort_column', params.sort_column)
      if (params.sort_direction) searchParams.set('sort_direction', params.sort_direction)
      return `${LUMA_BASE_URL}/event/get-guests?${searchParams.toString()}`
    },
    method: 'GET',
    headers: (params: any) => lumaHeaders(params.apiKey),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Luma API error: ${response.status}`)
    return {
      success: true,
      output: {
        guests: (data.entries || []).map(mapGuest),
        hasMore: data.has_more,
        nextCursor: data.next_cursor,
      },
    }
  },
  outputs: {
    guests: { type: 'json', description: 'List of guests' },
    hasMore: { type: 'boolean', description: 'Whether there are more guests' },
    nextCursor: { type: 'string', description: 'Cursor for next page' },
  },
}

export const lumaAddGuestsTool: ToolConfig = {
  id: 'luma_add_guests',
  name: 'Add Guests',
  description: 'Add guests to a Luma event',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Luma API key',
    },
    eventId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Event ID',
    },
    guests: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'JSON array of guest objects with email and optional name fields',
    },
  },
  request: {
    url: () => `${LUMA_BASE_URL}/event/add-guests`,
    method: 'POST',
    headers: (params: any) => lumaHeaders(params.apiKey),
    body: (params: any) => ({
      event_id: params.eventId.trim(),
      guests: JSON.parse(params.guests),
    }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || `Luma API error: ${response.status}`)
    return {
      success: true,
      output: {
        guests: (data.guests || []).map(mapGuest),
      },
    }
  },
  outputs: {
    guests: { type: 'json', description: 'Added guests' },
  },
}
