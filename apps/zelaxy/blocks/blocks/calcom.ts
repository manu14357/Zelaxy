import { CalendarIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const CalcomBlock: BlockConfig = {
  type: 'calcom',
  name: 'Cal.com',
  description: 'Manage bookings, slots, and events in Cal.com',
  longDescription:
    'Integrate Cal.com scheduling into your workflows. List bookings, create appointments, check availability slots, and manage event types.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#111827',
  icon: CalendarIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List Bookings', id: 'calcom_list_bookings' },
        { label: 'Create Booking', id: 'calcom_create_booking' },
        { label: 'Get Booking', id: 'calcom_get_booking' },
        { label: 'Cancel Booking', id: 'calcom_cancel_booking' },
        { label: 'Get Available Slots', id: 'calcom_get_slots' },
        { label: 'List Event Types', id: 'calcom_list_event_types' },
      ],
      required: true,
    },
    {
      id: 'credential',
      title: 'Cal.com Account',
      type: 'oauth-input',
      layout: 'full',
      provider: 'calcom',
    },
    {
      id: 'eventTypeId',
      title: 'Event Type ID',
      type: 'short-input',
      layout: 'full',
      placeholder: '123',
      condition: { field: 'operation', value: ['calcom_create_booking', 'calcom_get_slots'] },
    },
    {
      id: 'start',
      title: 'Start Date/Time',
      type: 'short-input',
      layout: 'half',
      placeholder: '2024-01-15T10:00:00Z',
      condition: {
        field: 'operation',
        value: ['calcom_create_booking', 'calcom_get_slots', 'calcom_list_bookings'],
      },
    },
    {
      id: 'end',
      title: 'End Date/Time',
      type: 'short-input',
      layout: 'half',
      placeholder: '2024-01-15T11:00:00Z',
      condition: {
        field: 'operation',
        value: ['calcom_create_booking', 'calcom_get_slots', 'calcom_list_bookings'],
      },
    },
    {
      id: 'bookingId',
      title: 'Booking ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'booking-id',
      condition: { field: 'operation', value: ['calcom_get_booking', 'calcom_cancel_booking'] },
    },
  ],
  tools: {
    access: [
      'calcom_list_bookings',
      'calcom_create_booking',
      'calcom_get_booking',
      'calcom_cancel_booking',
      'calcom_get_slots',
      'calcom_list_event_types',
    ],
    config: {
      tool: (params) => params.operation || 'calcom_list_bookings',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    oauthCredential: { type: 'string', description: 'OAuth credential' },
    eventTypeId: { type: 'string', description: 'Event type ID' },
    start: { type: 'string', description: 'Start date/time' },
    end: { type: 'string', description: 'End date/time' },
    bookingId: { type: 'string', description: 'Booking ID' },
  },
  outputs: {
    bookings: { type: 'json', description: 'Booking list' },
    booking: { type: 'json', description: 'Booking details' },
    slots: { type: 'json', description: 'Available slots' },
  },
}
