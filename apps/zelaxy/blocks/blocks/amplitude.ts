import { ChartBarIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const AmplitudeBlock: BlockConfig = {
  type: 'amplitude',
  name: 'Amplitude',
  description: 'Send events, identify users, and query analytics in Amplitude',
  longDescription:
    'Integrate Amplitude product analytics into your workflows. Track events, identify users, search user data, and export analytics.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#1B1F3B',
  icon: ChartBarIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Send Event', id: 'amplitude_send_event' },
        { label: 'Identify User', id: 'amplitude_identify_user' },
        { label: 'User Search', id: 'amplitude_user_search' },
        { label: 'Get User Activity', id: 'amplitude_get_user_activity' },
        { label: 'Export Events', id: 'amplitude_export_events' },
      ],
      required: true,
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'half',
      password: true,
      placeholder: 'Amplitude API key',
      required: true,
    },
    {
      id: 'secretKey',
      title: 'Secret Key',
      type: 'short-input',
      layout: 'half',
      password: true,
      placeholder: 'Amplitude secret key',
    },
    {
      id: 'eventType',
      title: 'Event Type',
      type: 'short-input',
      layout: 'full',
      placeholder: 'button_clicked',
      condition: { field: 'operation', value: ['amplitude_send_event'] },
    },
    {
      id: 'userId',
      title: 'User ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'user-123',
      condition: {
        field: 'operation',
        value: ['amplitude_send_event', 'amplitude_identify_user', 'amplitude_get_user_activity'],
      },
    },
    {
      id: 'eventProperties',
      title: 'Event Properties (JSON)',
      type: 'long-input',
      layout: 'full',
      placeholder: '{"page": "homepage", "action": "click"}',
      condition: { field: 'operation', value: ['amplitude_send_event', 'amplitude_identify_user'] },
    },
  ],
  tools: {
    access: [
      'amplitude_send_event',
      'amplitude_identify_user',
      'amplitude_user_search',
      'amplitude_get_user_activity',
      'amplitude_export_events',
    ],
    config: {
      tool: (params) => params.operation || 'amplitude_send_event',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'API key' },
    secretKey: { type: 'string', description: 'Secret key' },
    eventType: { type: 'string', description: 'Event type name' },
    userId: { type: 'string', description: 'User ID' },
    eventProperties: { type: 'string', description: 'Event properties JSON' },
  },
  outputs: {
    eventId: { type: 'string', description: 'Event ID' },
    user: { type: 'json', description: 'User data' },
    activeUsers: { type: 'number', description: 'Active user count' },
    revenue: { type: 'number', description: 'Revenue data' },
  },
}
