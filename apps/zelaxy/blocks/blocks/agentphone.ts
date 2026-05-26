import { MessagesIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const AgentPhoneBlock: BlockConfig = {
  type: 'agentphone',
  name: 'AgentPhone',
  description: 'Manage phone numbers and voice calls with AgentPhone',
  longDescription:
    'Automate voice communication with AgentPhone. Create and manage phone numbers, send messages, and initiate voice calls.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#1a1a2e',
  icon: MessagesIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Create Number', id: 'agentphone_create_number' },
        { label: 'List Numbers', id: 'agentphone_list_numbers' },
        { label: 'Release Number', id: 'agentphone_release_number' },
        { label: 'Send Message', id: 'agentphone_send_message' },
        { label: 'Create Call', id: 'agentphone_create_call' },
      ],
      required: true,
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      password: true,
      placeholder: 'Your AgentPhone API key',
      required: true,
    },
    {
      id: 'country',
      title: 'Country',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'United States', id: 'US' },
        { label: 'Canada', id: 'CA' },
      ],
      condition: { field: 'operation', value: ['agentphone_create_number'] },
    },
    {
      id: 'areaCode',
      title: 'Area Code',
      type: 'short-input',
      layout: 'half',
      placeholder: '415',
      condition: { field: 'operation', value: ['agentphone_create_number'] },
    },
    {
      id: 'numberId',
      title: 'Number ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'number-id',
      condition: {
        field: 'operation',
        value: ['agentphone_release_number', 'agentphone_send_message', 'agentphone_create_call'],
      },
    },
    {
      id: 'toNumber',
      title: 'To Number',
      type: 'short-input',
      layout: 'full',
      placeholder: '+14155551234',
      condition: {
        field: 'operation',
        value: ['agentphone_send_message', 'agentphone_create_call'],
      },
    },
  ],
  tools: {
    access: [
      'agentphone_create_number',
      'agentphone_list_numbers',
      'agentphone_release_number',
      'agentphone_send_message',
      'agentphone_create_call',
    ],
    config: {
      tool: (params) => params.operation || 'agentphone_create_number',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'API key' },
    country: { type: 'string', description: 'Country code' },
    areaCode: { type: 'string', description: 'Area code' },
    numberId: { type: 'string', description: 'Number ID' },
    toNumber: { type: 'string', description: 'Target phone number' },
  },
  outputs: {
    phoneNumber: { type: 'string', description: 'Phone number' },
    numberId: { type: 'string', description: 'Number ID' },
    callId: { type: 'string', description: 'Call ID' },
    status: { type: 'string', description: 'Status' },
  },
}
