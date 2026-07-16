import { LoopsIcon } from '@/components/icons/loops-icon'
import type { BlockConfig } from '@/blocks/types'
import type { LoopsResponse } from '@/tools/loops/types'

export const LoopsBlock: BlockConfig<LoopsResponse> = {
  type: 'loops',
  name: 'Loops',
  description: 'Manage contacts and send emails with Loops',
  longDescription:
    'Create and update contacts, send events to trigger automated sequences, and send transactional emails through the Loops API. Authenticate with a Loops API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#FF7878',
  icon: LoopsIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Create contact', id: 'loops_create_contact' },
        { label: 'Update contact', id: 'loops_update_contact' },
        { label: 'Send event', id: 'loops_send_event' },
        { label: 'Send transactional', id: 'loops_send_transactional' },
      ],
      value: () => 'loops_create_contact',
    },
    // Contact / event email
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'full',
      placeholder: 'contact@example.com',
      condition: {
        field: 'operation',
        value: [
          'loops_create_contact',
          'loops_update_contact',
          'loops_send_event',
          'loops_send_transactional',
        ],
      },
    },
    // Create / Update contact
    {
      id: 'firstName',
      title: 'First Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Jane',
      condition: {
        field: 'operation',
        value: ['loops_create_contact', 'loops_update_contact'],
      },
    },
    {
      id: 'lastName',
      title: 'Last Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Doe',
      condition: {
        field: 'operation',
        value: ['loops_create_contact', 'loops_update_contact'],
      },
    },
    // Send event
    {
      id: 'eventName',
      title: 'Event Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'signed_up',
      condition: { field: 'operation', value: 'loops_send_event' },
    },
    // Send transactional
    {
      id: 'transactionalId',
      title: 'Transactional ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'clfq6dinn000123456789abcd',
      condition: { field: 'operation', value: 'loops_send_transactional' },
    },
    {
      id: 'apiKey',
      title: 'Loops API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Loops API key',
      password: true,
      required: true,
    },
    // TRIGGER MODE: Trigger configuration (only shown when trigger mode is active)
    {
      id: 'triggerConfig',
      title: 'Trigger Configuration',
      type: 'trigger-config',
      layout: 'full',
      triggerProvider: 'loops',
      availableTriggers: ['loops_webhook'],
    },
  ],
  tools: {
    access: [
      'loops_create_contact',
      'loops_update_contact',
      'loops_send_event',
      'loops_send_transactional',
    ],
    config: {
      tool: (params) => params.operation || 'loops_create_contact',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Loops API key' },
    email: { type: 'string', description: 'Contact email' },
    firstName: { type: 'string', description: 'Contact first name' },
    lastName: { type: 'string', description: 'Contact last name' },
    eventName: { type: 'string', description: 'Event name' },
    transactionalId: { type: 'string', description: 'Transactional template ID' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from Loops' },
    metadata: { type: 'json', description: 'Response metadata' },
    event_type: { type: 'string', description: 'Loops event type (trigger events)' },
    email: { type: 'string', description: 'Recipient email' },
    campaign_name: { type: 'string', description: 'Campaign name' },
    link_url: { type: 'string', description: 'Clicked link' },
  },
  triggers: {
    enabled: true,
    available: ['loops_webhook'],
  },
}
