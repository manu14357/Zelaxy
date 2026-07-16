import { InstantlyIcon } from '@/components/icons/instantly-icon'
import type { BlockConfig } from '@/blocks/types'
import type { InstantlyResponse } from '@/tools/instantly/types'

export const InstantlyBlock: BlockConfig<InstantlyResponse> = {
  type: 'instantly',
  name: 'Instantly',
  description: 'Manage campaigns and leads in Instantly',
  longDescription:
    'List campaigns, create leads, and list leads through the Instantly V2 API. Authenticate with an Instantly API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#4338CA',
  icon: InstantlyIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List campaigns', id: 'instantly_list_campaigns' },
        { label: 'Create lead', id: 'instantly_create_lead' },
        { label: 'List leads', id: 'instantly_list_leads' },
      ],
      value: () => 'instantly_list_campaigns',
    },
    // Create lead
    {
      id: 'campaign',
      title: 'Campaign ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Campaign ID',
      condition: { field: 'operation', value: 'instantly_create_lead' },
    },
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'half',
      placeholder: 'lead@example.com',
      condition: { field: 'operation', value: 'instantly_create_lead' },
    },
    {
      id: 'apiKey',
      title: 'Instantly API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Instantly API key',
      password: true,
      required: true,
    },
    // TRIGGER MODE: Trigger configuration (only shown when trigger mode is active)
    {
      id: 'triggerConfig',
      title: 'Trigger Configuration',
      type: 'trigger-config',
      layout: 'full',
      triggerProvider: 'instantly',
      availableTriggers: ['instantly_webhook'],
    },
  ],
  tools: {
    access: ['instantly_list_campaigns', 'instantly_create_lead', 'instantly_list_leads'],
    config: {
      tool: (params) => params.operation || 'instantly_list_campaigns',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Instantly API key' },
    campaign: { type: 'string', description: 'Campaign ID' },
    email: { type: 'string', description: 'Lead email' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Instantly' },
    metadata: { type: 'json', description: 'Response metadata' },
    event_type: { type: 'string', description: 'Instantly event type (trigger events)' },
    lead_email: { type: 'string', description: 'Lead email' },
    campaign_name: { type: 'string', description: 'Campaign name' },
    reply_text: { type: 'string', description: 'Reply body' },
  },
  triggers: {
    enabled: true,
    available: ['instantly_webhook'],
  },
}
