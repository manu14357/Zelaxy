import { LaunchDarklyIcon } from '@/components/icons/launchdarkly-icon'
import type { BlockConfig } from '@/blocks/types'
import type { LaunchDarklyResponse } from '@/tools/launchdarkly/types'

export const LaunchDarklyBlock: BlockConfig<LaunchDarklyResponse> = {
  type: 'launchdarkly',
  name: 'LaunchDarkly',
  description: 'Manage feature flags and projects in LaunchDarkly',
  longDescription:
    'List feature flags, retrieve a single flag, and list projects through the LaunchDarkly REST API. Authenticate with an API access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#405BFF',
  icon: LaunchDarklyIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List flags', id: 'launchdarkly_list_flags' },
        { label: 'Get flag', id: 'launchdarkly_get_flag' },
        { label: 'List projects', id: 'launchdarkly_list_projects' },
      ],
      value: () => 'launchdarkly_list_flags',
    },
    {
      id: 'projectKey',
      title: 'Project Key',
      type: 'short-input',
      layout: 'half',
      placeholder: 'default',
      condition: {
        field: 'operation',
        value: ['launchdarkly_list_flags', 'launchdarkly_get_flag'],
      },
    },
    {
      id: 'flagKey',
      title: 'Flag Key',
      type: 'short-input',
      layout: 'half',
      placeholder: 'my-feature-flag',
      condition: { field: 'operation', value: 'launchdarkly_get_flag' },
    },
    {
      id: 'apiKey',
      title: 'API Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'api-...',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['launchdarkly_list_flags', 'launchdarkly_get_flag', 'launchdarkly_list_projects'],
    config: {
      tool: (params) => params.operation || 'launchdarkly_list_flags',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'LaunchDarkly API access token' },
    projectKey: { type: 'string', description: 'Project key' },
    flagKey: { type: 'string', description: 'Feature flag key' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from LaunchDarkly' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
