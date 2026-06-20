import { GoogleGroupsIcon } from '@/components/icons/google-groups-icon'
import type { BlockConfig } from '@/blocks/types'
import type { GoogleGroupsResponse } from '@/tools/google_groups/types'

export const GoogleGroupsBlock: BlockConfig<GoogleGroupsResponse> = {
  type: 'google_groups',
  name: 'Google Groups',
  description: 'Manage groups and members in Google Workspace',
  longDescription:
    'List and inspect Google Groups, list group members, and add members to a group through the Google Workspace Admin Directory API. Authenticate with a Google OAuth access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#1A73E8',
  icon: GoogleGroupsIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List groups', id: 'google_groups_list_groups' },
        { label: 'Get group', id: 'google_groups_get_group' },
        { label: 'List members', id: 'google_groups_list_members' },
        { label: 'Add member', id: 'google_groups_add_member' },
      ],
      value: () => 'google_groups_list_groups',
    },
    {
      id: 'groupKey',
      title: 'Group Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'team@example.com or group ID',
      condition: {
        field: 'operation',
        value: [
          'google_groups_get_group',
          'google_groups_list_members',
          'google_groups_add_member',
        ],
      },
    },
    {
      id: 'email',
      title: 'Member Email',
      type: 'short-input',
      layout: 'half',
      placeholder: 'user@example.com',
      condition: { field: 'operation', value: 'google_groups_add_member' },
    },
    {
      id: 'role',
      title: 'Role',
      type: 'short-input',
      layout: 'half',
      placeholder: 'MEMBER',
      condition: { field: 'operation', value: 'google_groups_add_member' },
    },
    {
      id: 'maxResults',
      title: 'Max Results',
      type: 'short-input',
      layout: 'half',
      placeholder: '50',
      condition: {
        field: 'operation',
        value: ['google_groups_list_groups', 'google_groups_list_members'],
      },
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
      'google_groups_list_groups',
      'google_groups_get_group',
      'google_groups_list_members',
      'google_groups_add_member',
    ],
    config: {
      tool: (params) => params.operation || 'google_groups_list_groups',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    accessToken: { type: 'string', description: 'Google OAuth access token' },
    groupKey: { type: 'string', description: 'Group email or unique group ID' },
    email: { type: 'string', description: 'Member email address' },
    role: { type: 'string', description: 'Member role (MEMBER, MANAGER, OWNER)' },
    maxResults: { type: 'number', description: 'Maximum number of results to return' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Google Groups' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
