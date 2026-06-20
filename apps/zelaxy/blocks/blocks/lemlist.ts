import { LemlistIcon } from '@/components/icons/lemlist-icon'
import type { BlockConfig } from '@/blocks/types'
import type { LemlistResponse } from '@/tools/lemlist/types'

export const LemlistBlock: BlockConfig<LemlistResponse> = {
  type: 'lemlist',
  name: 'Lemlist',
  description: 'Manage outreach campaigns and leads in Lemlist',
  longDescription:
    'List and retrieve campaigns, add leads to a campaign, and list campaign activities through the Lemlist API. Authenticate with a Lemlist API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#4A4AEE',
  icon: LemlistIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List campaigns', id: 'lemlist_list_campaigns' },
        { label: 'Get campaign', id: 'lemlist_get_campaign' },
        { label: 'Add lead', id: 'lemlist_add_lead' },
        { label: 'List activities', id: 'lemlist_list_activities' },
      ],
      value: () => 'lemlist_list_campaigns',
    },
    // Get campaign / Add lead
    {
      id: 'campaignId',
      title: 'Campaign ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'cam_abc123def456',
      condition: {
        field: 'operation',
        value: ['lemlist_get_campaign', 'lemlist_add_lead'],
      },
    },
    // Add lead
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'half',
      placeholder: 'lead@example.com',
      condition: { field: 'operation', value: 'lemlist_add_lead' },
    },
    {
      id: 'firstName',
      title: 'First Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Jane',
      condition: { field: 'operation', value: 'lemlist_add_lead' },
    },
    {
      id: 'lastName',
      title: 'Last Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Doe',
      condition: { field: 'operation', value: 'lemlist_add_lead' },
    },
    {
      id: 'apiKey',
      title: 'Lemlist API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Lemlist API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'lemlist_list_campaigns',
      'lemlist_get_campaign',
      'lemlist_add_lead',
      'lemlist_list_activities',
    ],
    config: {
      tool: (params) => params.operation || 'lemlist_list_campaigns',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Lemlist API key' },
    campaignId: { type: 'string', description: 'Campaign ID' },
    email: { type: 'string', description: 'Lead email' },
    firstName: { type: 'string', description: 'Lead first name' },
    lastName: { type: 'string', description: 'Lead last name' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Lemlist' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
