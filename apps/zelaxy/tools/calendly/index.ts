import type { ToolConfig } from '@/tools/types'

export const calendlyGetCurrentUserTool: ToolConfig = {
  id: 'calendly_get_current_user',
  name: 'Calendly Get Current User',
  description: 'Get information about the currently authenticated Calendly user.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Calendly Personal Access Token',
    },
  },

  request: {
    url: 'https://api.calendly.com/users/me',
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return { success: true, output: data }
  },

  outputs: {
    resource: { type: 'object', description: 'Current user information' },
  },
}

export const calendlyListEventTypesTool: ToolConfig = {
  id: 'calendly_list_event_types',
  name: 'Calendly List Event Types',
  description: 'Retrieve a list of all event types for a user or organization.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Calendly Personal Access Token',
    },
    user: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'User URI to filter event types',
    },
    organization: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Organization URI to filter event types',
    },
    count: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results per page (max 100)',
    },
    pageToken: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Page token for pagination',
    },
    sort: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort order (e.g., "name:asc")',
    },
    active: {
      type: 'boolean',
      required: false,
      visibility: 'user-only',
      description: 'When true, show only active event types',
    },
  },

  request: {
    url: (params) => {
      const queryParams: string[] = []
      if (params.user) queryParams.push(`user=${encodeURIComponent(params.user)}`)
      if (params.organization)
        queryParams.push(`organization=${encodeURIComponent(params.organization)}`)
      if (params.count) queryParams.push(`count=${Number(params.count)}`)
      if (params.pageToken) queryParams.push(`page_token=${encodeURIComponent(params.pageToken)}`)
      if (params.sort) queryParams.push(`sort=${encodeURIComponent(params.sort)}`)
      if (params.active === true) queryParams.push('active=true')
      const base = 'https://api.calendly.com/event_types'
      return queryParams.length > 0 ? `${base}?${queryParams.join('&')}` : base
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return { success: true, output: data }
  },

  outputs: {
    collection: { type: 'array', description: 'Array of event type objects' },
    pagination: { type: 'object', description: 'Pagination information' },
  },
}

export const calendlyGetEventTypeTool: ToolConfig = {
  id: 'calendly_get_event_type',
  name: 'Calendly Get Event Type',
  description: 'Get detailed information about a specific event type.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Calendly Personal Access Token',
    },
    eventTypeUuid: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Event type UUID or full URI',
    },
  },

  request: {
    url: (params) => {
      const uuid = params.eventTypeUuid.includes('/')
        ? params.eventTypeUuid.split('/').pop()
        : params.eventTypeUuid
      return `https://api.calendly.com/event_types/${uuid}`
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return { success: true, output: data }
  },

  outputs: {
    resource: { type: 'object', description: 'Event type details' },
  },
}

export const calendlyListScheduledEventsTool: ToolConfig = {
  id: 'calendly_list_scheduled_events',
  name: 'Calendly List Scheduled Events',
  description: 'Retrieve a list of scheduled events for a user or organization.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Calendly Personal Access Token',
    },
    user: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'User URI (either user or organization required)',
    },
    organization: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Organization URI (either user or organization required)',
    },
    invitee_email: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Filter by invitee email',
    },
    count: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results per page (max 100)',
    },
    min_start_time: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter events with start time after this ISO 8601 time',
    },
    max_start_time: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter events with start time before this ISO 8601 time',
    },
    pageToken: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Page token for pagination',
    },
    sort: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort order (e.g., "start_time:asc")',
    },
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by status: "active" or "canceled"',
    },
  },

  request: {
    url: (params) => {
      if (!params.user && !params.organization) {
        throw new Error('At least one of "user" or "organization" parameter is required.')
      }
      const queryParams: string[] = []
      if (params.user) queryParams.push(`user=${encodeURIComponent(params.user)}`)
      if (params.organization)
        queryParams.push(`organization=${encodeURIComponent(params.organization)}`)
      if (params.invitee_email)
        queryParams.push(`invitee_email=${encodeURIComponent(params.invitee_email)}`)
      if (params.count) queryParams.push(`count=${Number(params.count)}`)
      if (params.min_start_time)
        queryParams.push(`min_start_time=${encodeURIComponent(params.min_start_time)}`)
      if (params.max_start_time)
        queryParams.push(`max_start_time=${encodeURIComponent(params.max_start_time)}`)
      if (params.pageToken) queryParams.push(`page_token=${encodeURIComponent(params.pageToken)}`)
      if (params.sort) queryParams.push(`sort=${encodeURIComponent(params.sort)}`)
      if (params.status) queryParams.push(`status=${encodeURIComponent(params.status)}`)
      const base = 'https://api.calendly.com/scheduled_events'
      return queryParams.length > 0 ? `${base}?${queryParams.join('&')}` : base
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return { success: true, output: data }
  },

  outputs: {
    collection: { type: 'array', description: 'Array of scheduled event objects' },
    pagination: { type: 'object', description: 'Pagination information' },
  },
}

export const calendlyGetScheduledEventTool: ToolConfig = {
  id: 'calendly_get_scheduled_event',
  name: 'Calendly Get Scheduled Event',
  description: 'Get detailed information about a specific scheduled event.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Calendly Personal Access Token',
    },
    eventUuid: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Scheduled event UUID or full URI',
    },
  },

  request: {
    url: (params) => {
      const uuid = params.eventUuid.includes('/')
        ? params.eventUuid.split('/').pop()
        : params.eventUuid
      return `https://api.calendly.com/scheduled_events/${uuid}`
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return { success: true, output: data }
  },

  outputs: {
    resource: { type: 'object', description: 'Scheduled event details' },
  },
}

export const calendlyListEventInviteesTool: ToolConfig = {
  id: 'calendly_list_event_invitees',
  name: 'Calendly List Event Invitees',
  description: 'Retrieve a list of invitees for a scheduled event.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Calendly Personal Access Token',
    },
    eventUuid: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Scheduled event UUID or full URI',
    },
    count: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results per page (max 100)',
    },
    email: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Filter invitees by email address',
    },
    pageToken: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Page token for pagination',
    },
    sort: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort order (e.g., "created_at:asc")',
    },
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by status: "active" or "canceled"',
    },
  },

  request: {
    url: (params) => {
      const uuid = params.eventUuid.includes('/')
        ? params.eventUuid.split('/').pop()
        : params.eventUuid
      const queryParams: string[] = []
      if (params.count) queryParams.push(`count=${Number(params.count)}`)
      if (params.email) queryParams.push(`email=${encodeURIComponent(params.email)}`)
      if (params.pageToken) queryParams.push(`page_token=${encodeURIComponent(params.pageToken)}`)
      if (params.sort) queryParams.push(`sort=${encodeURIComponent(params.sort)}`)
      if (params.status) queryParams.push(`status=${encodeURIComponent(params.status)}`)
      const base = `https://api.calendly.com/scheduled_events/${uuid}/invitees`
      return queryParams.length > 0 ? `${base}?${queryParams.join('&')}` : base
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return { success: true, output: data }
  },

  outputs: {
    collection: { type: 'array', description: 'Array of invitee objects' },
    pagination: { type: 'object', description: 'Pagination information' },
  },
}

export const calendlyCancelEventTool: ToolConfig = {
  id: 'calendly_cancel_event',
  name: 'Calendly Cancel Event',
  description: 'Cancel a scheduled event.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Calendly Personal Access Token',
    },
    eventUuid: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Scheduled event UUID or full URI',
    },
    reason: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Reason for cancellation',
    },
  },

  request: {
    url: (params) => {
      const uuid = params.eventUuid.includes('/')
        ? params.eventUuid.split('/').pop()
        : params.eventUuid
      return `https://api.calendly.com/scheduled_events/${uuid}/cancellation`
    },
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, unknown> = {}
      if (params.reason) body.reason = params.reason
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return { success: true, output: data }
  },

  outputs: {
    resource: { type: 'object', description: 'Cancellation details' },
  },
}
