import { GoogleMeetIcon } from '@/components/icons/google-meet-icon'
import type { BlockConfig } from '@/blocks/types'
import type { GoogleMeetResponse } from '@/tools/google_meet/types'

export const GoogleMeetBlock: BlockConfig<GoogleMeetResponse> = {
  type: 'google_meet',
  name: 'Google Meet',
  description: 'Create meeting spaces and review conference records in Google Meet',
  longDescription:
    'Create Google Meet spaces, retrieve space details, and list conference records. Authenticate with a Google OAuth access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#00897B',
  icon: GoogleMeetIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Create space', id: 'google_meet_create_space' },
        { label: 'Get space', id: 'google_meet_get_space' },
        { label: 'List conference records', id: 'google_meet_list_conference_records' },
      ],
      value: () => 'google_meet_create_space',
    },
    {
      id: 'name',
      title: 'Space Name or Meeting Code',
      type: 'short-input',
      layout: 'full',
      placeholder: 'spaces/abc123 or abc-defg-hij',
      condition: { field: 'operation', value: 'google_meet_get_space' },
    },
    {
      id: 'filter',
      title: 'Filter',
      type: 'short-input',
      layout: 'full',
      placeholder: 'space.name = "spaces/abc123"',
      condition: { field: 'operation', value: 'google_meet_list_conference_records' },
    },
    {
      id: 'pageSize',
      title: 'Page Size',
      type: 'short-input',
      layout: 'half',
      placeholder: '50',
      condition: { field: 'operation', value: 'google_meet_list_conference_records' },
    },
    {
      id: 'accessToken',
      title: 'Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Google OAuth access token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'google_meet_create_space',
      'google_meet_get_space',
      'google_meet_list_conference_records',
    ],
    config: {
      tool: (params) => params.operation || 'google_meet_create_space',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    accessToken: { type: 'string', description: 'Google OAuth access token' },
    name: { type: 'string', description: 'Space resource name or meeting code' },
    filter: { type: 'string', description: 'Filter for conference records' },
    pageSize: { type: 'number', description: 'Maximum number of records to return' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Google Meet' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
