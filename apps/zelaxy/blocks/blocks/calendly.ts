import { CalendarIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const CalendlyBlock: BlockConfig = {
  type: 'calendly',
  name: 'Calendly',
  description: 'Manage event types, scheduled events, and invitees in Calendly',
  longDescription:
    'Integrate Calendly scheduling into your workflows. List event types, view scheduled events, manage invitees, and cancel appointments.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#006BFF',
  icon: CalendarIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Get Current User', id: 'calendly_get_current_user' },
        { label: 'List Event Types', id: 'calendly_list_event_types' },
        { label: 'Get Event Type', id: 'calendly_get_event_type' },
        { label: 'List Scheduled Events', id: 'calendly_list_scheduled_events' },
        { label: 'Get Scheduled Event', id: 'calendly_get_scheduled_event' },
        { label: 'List Event Invitees', id: 'calendly_list_event_invitees' },
        { label: 'Cancel Event', id: 'calendly_cancel_event' },
      ],
      required: true,
    },
    {
      id: 'apiKey',
      title: 'Personal Access Token',
      type: 'short-input',
      layout: 'full',
      password: true,
      placeholder: 'Your Calendly API token',
      required: true,
    },
    {
      id: 'eventTypeUuid',
      title: 'Event Type UUID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'event-type-uuid',
      condition: {
        field: 'operation',
        value: ['calendly_get_event_type', 'calendly_list_event_invitees'],
      },
    },
    {
      id: 'user',
      title: 'User URI',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://api.calendly.com/users/xxx',
      condition: {
        field: 'operation',
        value: ['calendly_list_event_types', 'calendly_list_scheduled_events'],
      },
    },
    {
      id: 'organization',
      title: 'Organization URI',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://api.calendly.com/organizations/xxx',
      condition: { field: 'operation', value: ['calendly_list_scheduled_events'] },
    },
    // TRIGGER MODE: Trigger configuration (only shown when trigger mode is active)
    {
      id: 'triggerConfig',
      title: 'Trigger Configuration',
      type: 'trigger-config',
      layout: 'full',
      triggerProvider: 'calendly',
      availableTriggers: ['calendly_webhook'],
    },
  ],
  tools: {
    access: [
      'calendly_get_current_user',
      'calendly_list_event_types',
      'calendly_get_event_type',
      'calendly_list_scheduled_events',
      'calendly_get_scheduled_event',
      'calendly_list_event_invitees',
      'calendly_cancel_event',
    ],
    config: {
      tool: (params) => params.operation || 'calendly_list_event_types',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'API token' },
    eventTypeUuid: { type: 'string', description: 'Event type UUID' },
    user: { type: 'string', description: 'User URI' },
    organization: { type: 'string', description: 'Organization URI' },
  },
  outputs: {
    eventTypes: { type: 'json', description: 'Event types' },
    events: { type: 'json', description: 'Scheduled events' },
    invitees: { type: 'json', description: 'Event invitees' },
    event: { type: 'string', description: 'Calendly event that occurred (trigger events)' },
    invitee_email: { type: 'string', description: 'Invitee email address' },
    invitee_name: { type: 'string', description: 'Invitee full name' },
    start_time: { type: 'string', description: 'Scheduled event start time' },
  },
  triggers: {
    enabled: true,
    available: ['calendly_webhook'],
  },
}
