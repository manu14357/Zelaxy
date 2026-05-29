import type { SVGProps } from 'react'
import { createElement } from 'react'
import { Calendar } from 'lucide-react'
import type { BlockConfig } from '@/blocks/types'

const LumaIcon = (props: SVGProps<SVGSVGElement>) => createElement(Calendar, props)

export const LumaBlock: BlockConfig = {
  type: 'luma',
  name: 'Luma',
  description: 'Manage events and guests on Luma',
  longDescription:
    'Integrate Luma into the workflow. Can create events, update events, get event details, list calendar events, get guest lists, and add guests to events.',
  docsLink: 'https://docs.zelaxy.ai/tools/luma',
  category: 'tools',
  bgColor: '#FFFFFF',
  icon: LumaIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      options: [
        { label: 'Get Event', id: 'get_event' },
        { label: 'Create Event', id: 'create_event' },
        { label: 'Update Event', id: 'update_event' },
        { label: 'List Events', id: 'list_events' },
        { label: 'Get Guests', id: 'get_guests' },
        { label: 'Add Guests', id: 'add_guests' },
      ],
      value: () => 'get_event',
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      placeholder: 'Enter your Luma API key',
      password: true,
      required: true,
    },
    {
      id: 'eventId',
      title: 'Event ID',
      type: 'short-input',
      placeholder: 'evt-...',
      required: true,
      condition: {
        field: 'operation',
        value: ['get_event', 'update_event', 'get_guests', 'add_guests'],
      },
    },
    {
      id: 'name',
      title: 'Event Name',
      type: 'short-input',
      placeholder: 'My Event',
      required: true,
      condition: { field: 'operation', value: ['create_event', 'update_event'] },
    },
    {
      id: 'startAt',
      title: 'Start Time',
      type: 'short-input',
      placeholder: '2025-03-15T18:00:00Z',
      required: true,
      condition: { field: 'operation', value: ['create_event', 'update_event'] },
      wandConfig: {
        enabled: true,
        prompt: `Generate an ISO 8601 timestamp based on the user's description.
Return ONLY the ISO 8601 timestamp - no explanations, no quotes, no extra text.`,
        placeholder: 'Describe the start time (e.g., "next Friday at 6pm EST")...',
      },
    },
    {
      id: 'timezone',
      title: 'Timezone',
      type: 'short-input',
      placeholder: 'America/New_York',
      required: true,
      condition: { field: 'operation', value: ['create_event', 'update_event'] },
      wandConfig: {
        enabled: true,
        prompt: `Generate an IANA timezone identifier based on the user's description.
Return ONLY the IANA timezone string - no explanations, no quotes, no extra text.`,
        placeholder: 'Describe the timezone (e.g., "eastern time", "london")...',
      },
    },
    {
      id: 'endAt',
      title: 'End Time',
      type: 'short-input',
      placeholder: '2025-03-15T20:00:00Z',
      condition: { field: 'operation', value: ['create_event', 'update_event'] },
      wandConfig: {
        enabled: true,
        prompt: `Generate an ISO 8601 timestamp for the event end time. Return ONLY the ISO 8601 timestamp.`,
        placeholder: 'Describe the end time (e.g., "2 hours after start", "8pm")...',
      },
    },
    {
      id: 'durationInterval',
      title: 'Duration',
      type: 'short-input',
      placeholder: 'PT2H (2 hours)',
      condition: { field: 'operation', value: ['create_event', 'update_event'] },
      mode: 'advanced',
      wandConfig: {
        enabled: true,
        prompt: `Generate an ISO 8601 duration interval based on the user's description. Return ONLY the ISO 8601 duration.`,
        placeholder: 'Describe the duration (e.g., "2 hours", "90 minutes")...',
      },
    },
    {
      id: 'descriptionMd',
      title: 'Description',
      type: 'long-input',
      placeholder: 'Event description (Markdown supported)',
      condition: { field: 'operation', value: ['create_event', 'update_event'] },
    },
    {
      id: 'meetingUrl',
      title: 'Meeting URL',
      type: 'short-input',
      placeholder: 'https://zoom.us/j/...',
      condition: { field: 'operation', value: ['create_event', 'update_event'] },
      mode: 'advanced',
    },
    {
      id: 'visibility',
      title: 'Visibility',
      type: 'dropdown',
      options: [
        { label: 'Public', id: 'public' },
        { label: 'Members Only', id: 'members-only' },
        { label: 'Private', id: 'private' },
      ],
      condition: { field: 'operation', value: ['create_event', 'update_event'] },
    },
    {
      id: 'coverUrl',
      title: 'Cover Image URL',
      type: 'short-input',
      placeholder: 'https://images.lumacdn.com/...',
      condition: { field: 'operation', value: ['create_event', 'update_event'] },
      mode: 'advanced',
    },
    {
      id: 'approvalStatus',
      title: 'Status Filter',
      type: 'dropdown',
      options: [
        { label: 'All', id: '' },
        { label: 'Approved', id: 'approved' },
        { label: 'Session', id: 'session' },
        { label: 'Pending Approval', id: 'pending_approval' },
        { label: 'Invited', id: 'invited' },
        { label: 'Declined', id: 'declined' },
        { label: 'Waitlist', id: 'waitlist' },
      ],
      condition: { field: 'operation', value: 'get_guests' },
    },
    {
      id: 'guests',
      title: 'Guests',
      type: 'long-input',
      placeholder: '[{"email": "user@example.com", "name": "John Doe"}]',
      required: true,
      condition: { field: 'operation', value: 'add_guests' },
      wandConfig: {
        enabled: true,
        prompt: `Generate a JSON array of guest objects for adding to a Luma event.
Each guest requires an "email" field and optionally "name", "first_name", "last_name".
Return ONLY the JSON array - no explanations, no markdown, no extra text.`,
        placeholder: 'Describe the guests to add...',
      },
    },
    {
      id: 'after',
      title: 'After Date',
      type: 'short-input',
      placeholder: '2025-01-01T00:00:00Z',
      condition: { field: 'operation', value: 'list_events' },
    },
    {
      id: 'before',
      title: 'Before Date',
      type: 'short-input',
      placeholder: '2025-12-31T23:59:59Z',
      condition: { field: 'operation', value: 'list_events' },
    },
    {
      id: 'paginationLimit',
      title: 'Limit',
      type: 'short-input',
      placeholder: 'Max results per page',
      condition: { field: 'operation', value: ['list_events', 'get_guests'] },
      mode: 'advanced',
    },
    {
      id: 'paginationCursor',
      title: 'Pagination Cursor',
      type: 'short-input',
      placeholder: 'Cursor from previous response',
      condition: { field: 'operation', value: ['list_events', 'get_guests'] },
      mode: 'advanced',
    },
    {
      id: 'sortColumn',
      title: 'Sort By',
      type: 'short-input',
      placeholder: 'e.g., start_at, name, registered_at',
      condition: { field: 'operation', value: ['list_events', 'get_guests'] },
      mode: 'advanced',
    },
    {
      id: 'sortDirection',
      title: 'Sort Direction',
      type: 'dropdown',
      options: [
        { label: 'Ascending', id: 'asc' },
        { label: 'Descending', id: 'desc' },
      ],
      condition: { field: 'operation', value: ['list_events', 'get_guests'] },
      mode: 'advanced',
    },
  ],
  tools: {
    access: [
      'luma_get_event',
      'luma_create_event',
      'luma_update_event',
      'luma_list_events',
      'luma_get_guests',
      'luma_add_guests',
    ],
    config: {
      tool: (params) => `luma_${params.operation}`,
      params: (params) => {
        const result: Record<string, unknown> = {}
        if (params.paginationLimit) result.paginationLimit = Number(params.paginationLimit)
        return result
      },
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Luma API key' },
    eventId: { type: 'string', description: 'Event ID (starts with evt-)' },
    name: { type: 'string', description: 'Event name' },
    startAt: { type: 'string', description: 'Event start time (ISO 8601)' },
    timezone: { type: 'string', description: 'Event timezone (IANA)' },
    durationInterval: { type: 'string', description: 'Event duration (ISO 8601 interval)' },
    endAt: { type: 'string', description: 'Event end time (ISO 8601)' },
    descriptionMd: { type: 'string', description: 'Event description (Markdown)' },
    meetingUrl: { type: 'string', description: 'Virtual meeting URL' },
    visibility: { type: 'string', description: 'Event visibility' },
    coverUrl: { type: 'string', description: 'Cover image URL (Luma CDN)' },
    approvalStatus: { type: 'string', description: 'Guest approval status filter' },
    guests: { type: 'string', description: 'JSON array of guest objects' },
    after: { type: 'string', description: 'Filter events after this date (ISO 8601)' },
    before: { type: 'string', description: 'Filter events before this date (ISO 8601)' },
    paginationLimit: { type: 'number', description: 'Max results per page' },
    paginationCursor: { type: 'string', description: 'Pagination cursor from previous response' },
    sortColumn: { type: 'string', description: 'Column to sort by' },
    sortDirection: { type: 'string', description: 'Sort direction (asc or desc)' },
  },
  outputs: {
    event: {
      type: 'json',
      description: 'Event details (id, name, startAt, endAt, timezone, createdAt, description, coverUrl, url, visibility, meetingUrl)',
    },
    hosts: {
      type: 'json',
      description: 'Event hosts (id, name, firstName, lastName, email, avatarUrl)',
    },
    events: {
      type: 'json',
      description: 'List of events with id, name, startAt, endAt, timezone, createdAt, description, coverUrl, url, visibility, meetingUrl',
    },
    guests: {
      type: 'json',
      description: 'List of guests (id, email, name, firstName, lastName, approvalStatus, registeredAt, invitedAt, joinedAt, checkedInAt)',
    },
    hasMore: { type: 'boolean', description: 'Whether more results are available' },
    nextCursor: { type: 'string', description: 'Pagination cursor for next page' },
  },
}
