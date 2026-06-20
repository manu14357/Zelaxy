import { PostHogIcon } from '@/components/icons/posthog-icon'
import type { BlockConfig } from '@/blocks/types'
import type { PostHogResponse } from '@/tools/posthog/types'

export const PostHogBlock: BlockConfig<PostHogResponse> = {
  type: 'posthog',
  name: 'PostHog',
  description: 'Capture events and query analytics in PostHog',
  longDescription:
    'Capture events, run HogQL queries, and list insights through the PostHog API. Authenticate with a project API key for ingestion or a personal API key for analytics.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#F54E00',
  icon: PostHogIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Capture event', id: 'posthog_capture_event' },
        { label: 'Query', id: 'posthog_query' },
        { label: 'List insights', id: 'posthog_list_insights' },
      ],
      value: () => 'posthog_capture_event',
    },
    // Capture event
    {
      id: 'event',
      title: 'Event',
      type: 'short-input',
      layout: 'half',
      placeholder: 'button_clicked',
      condition: { field: 'operation', value: 'posthog_capture_event' },
    },
    {
      id: 'distinct_id',
      title: 'Distinct ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'user123',
      condition: { field: 'operation', value: 'posthog_capture_event' },
    },
    {
      id: 'properties',
      title: 'Properties',
      type: 'long-input',
      layout: 'full',
      placeholder: '{ "plan": "pro" }',
      condition: { field: 'operation', value: 'posthog_capture_event' },
    },
    {
      id: 'projectApiKey',
      title: 'Project API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'phc_...',
      password: true,
      condition: { field: 'operation', value: 'posthog_capture_event' },
    },
    // Query / List insights
    {
      id: 'projectId',
      title: 'Project ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '12345',
      condition: { field: 'operation', value: ['posthog_query', 'posthog_list_insights'] },
    },
    {
      id: 'query',
      title: 'HogQL Query',
      type: 'long-input',
      layout: 'full',
      placeholder: 'SELECT event, count() FROM events GROUP BY event',
      condition: { field: 'operation', value: 'posthog_query' },
    },
    {
      id: 'apiKey',
      title: 'Personal API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'phx_...',
      password: true,
      condition: { field: 'operation', value: ['posthog_query', 'posthog_list_insights'] },
    },
    // Connection
    {
      id: 'host',
      title: 'Host',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://us.posthog.com',
      required: true,
    },
  ],
  tools: {
    access: ['posthog_capture_event', 'posthog_query', 'posthog_list_insights'],
    config: {
      tool: (params) => params.operation || 'posthog_capture_event',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    host: { type: 'string', description: 'PostHog host URL' },
    apiKey: { type: 'string', description: 'PostHog personal API key' },
    projectApiKey: { type: 'string', description: 'PostHog project API key' },
    projectId: { type: 'string', description: 'PostHog project ID' },
    event: { type: 'string', description: 'Event name' },
    distinct_id: { type: 'string', description: 'User or device identifier' },
    properties: { type: 'json', description: 'Event properties' },
    query: { type: 'string', description: 'HogQL query string' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from PostHog' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
