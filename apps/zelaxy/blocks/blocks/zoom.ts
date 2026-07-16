import { ZoomIcon } from '@/components/icons/zoom-icon'
import type { BlockConfig } from '@/blocks/types'
import type { ZoomResponse } from '@/tools/zoom/types'

export const ZoomBlock: BlockConfig<ZoomResponse> = {
  type: 'zoom',
  name: 'Zoom',
  description: 'Manage Zoom meetings and users',
  longDescription:
    'List and create meetings, fetch meeting details, and list users through the Zoom API. Authenticate with a Zoom OAuth access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#2D8CFF',
  icon: ZoomIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List meetings', id: 'zoom_list_meetings' },
        { label: 'Create meeting', id: 'zoom_create_meeting' },
        { label: 'Get meeting', id: 'zoom_get_meeting' },
        { label: 'List users', id: 'zoom_list_users' },
      ],
      value: () => 'zoom_list_meetings',
    },
    // List meetings / Create meeting (userId)
    {
      id: 'userId',
      title: 'User ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'me',
      condition: { field: 'operation', value: ['zoom_list_meetings', 'zoom_create_meeting'] },
    },
    {
      id: 'type',
      title: 'Type',
      type: 'short-input',
      layout: 'half',
      placeholder: 'scheduled',
      condition: { field: 'operation', value: 'zoom_list_meetings' },
    },
    // Create meeting
    {
      id: 'topic',
      title: 'Topic',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Weekly Team Standup',
      condition: { field: 'operation', value: 'zoom_create_meeting' },
    },
    {
      id: 'start_time',
      title: 'Start Time',
      type: 'short-input',
      layout: 'half',
      placeholder: '2025-06-03T10:00:00Z',
      condition: { field: 'operation', value: 'zoom_create_meeting' },
    },
    {
      id: 'duration',
      title: 'Duration (minutes)',
      type: 'short-input',
      layout: 'half',
      placeholder: '60',
      condition: { field: 'operation', value: 'zoom_create_meeting' },
    },
    {
      id: 'timezone',
      title: 'Timezone',
      type: 'short-input',
      layout: 'half',
      placeholder: 'America/Los_Angeles',
      condition: { field: 'operation', value: 'zoom_create_meeting' },
    },
    {
      id: 'agenda',
      title: 'Agenda',
      type: 'long-input',
      layout: 'full',
      condition: { field: 'operation', value: 'zoom_create_meeting' },
    },
    // Get meeting
    {
      id: 'meetingId',
      title: 'Meeting ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '1234567890',
      condition: { field: 'operation', value: 'zoom_get_meeting' },
    },
    // List users
    {
      id: 'status',
      title: 'Status',
      type: 'short-input',
      layout: 'half',
      placeholder: 'active',
      condition: { field: 'operation', value: 'zoom_list_users' },
    },
    {
      id: 'page_size',
      title: 'Page Size',
      type: 'short-input',
      layout: 'half',
      placeholder: '30',
      condition: { field: 'operation', value: ['zoom_list_meetings', 'zoom_list_users'] },
    },
    {
      id: 'apiKey',
      title: 'Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Zoom OAuth access token',
      password: true,
      required: true,
    },
    // TRIGGER MODE: Trigger configuration (only shown when trigger mode is active)
    {
      id: 'triggerConfig',
      title: 'Trigger Configuration',
      type: 'trigger-config',
      layout: 'full',
      triggerProvider: 'zoom',
      availableTriggers: ['zoom_webhook'],
    },
  ],
  tools: {
    access: ['zoom_list_meetings', 'zoom_create_meeting', 'zoom_get_meeting', 'zoom_list_users'],
    config: {
      tool: (params) => params.operation || 'zoom_list_meetings',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Zoom OAuth access token' },
    userId: { type: 'string', description: 'User ID or email' },
    type: { type: 'string', description: 'Meeting type filter' },
    topic: { type: 'string', description: 'Meeting topic' },
    start_time: { type: 'string', description: 'Meeting start time (ISO 8601)' },
    duration: { type: 'number', description: 'Meeting duration in minutes' },
    timezone: { type: 'string', description: 'Meeting timezone' },
    agenda: { type: 'string', description: 'Meeting agenda' },
    meetingId: { type: 'string', description: 'Meeting ID' },
    status: { type: 'string', description: 'User status filter' },
    page_size: { type: 'number', description: 'Records per page' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Zoom' },
    metadata: { type: 'json', description: 'Response metadata' },
    event_type: { type: 'string', description: 'Zoom event type (trigger events)' },
    topic: { type: 'string', description: 'Meeting topic' },
    meeting_id: { type: 'string', description: 'Meeting ID' },
    participant_name: { type: 'string', description: 'Participant name' },
  },
  triggers: {
    enabled: true,
    available: ['zoom_webhook'],
  },
}
