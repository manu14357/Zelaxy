import { SentryIcon } from '@/components/icons/sentry-icon'
import type { BlockConfig } from '@/blocks/types'
import type { SentryResponse } from '@/tools/sentry/types'

export const SentryBlock: BlockConfig<SentryResponse> = {
  type: 'sentry',
  name: 'Sentry',
  description: 'Manage projects and issues in Sentry',
  longDescription:
    'List projects, list and inspect issues, and update issue status through the Sentry API. Authenticate with a Sentry auth token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#362D59',
  icon: SentryIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List projects', id: 'sentry_list_projects' },
        { label: 'List issues', id: 'sentry_list_issues' },
        { label: 'Get issue', id: 'sentry_get_issue' },
        { label: 'Update issue', id: 'sentry_update_issue' },
      ],
      value: () => 'sentry_list_projects',
    },
    {
      id: 'organizationSlug',
      title: 'Organization Slug',
      type: 'short-input',
      layout: 'half',
      placeholder: 'my-org',
      condition: { field: 'operation', value: 'sentry_list_issues' },
    },
    {
      id: 'projectSlug',
      title: 'Project Slug',
      type: 'short-input',
      layout: 'half',
      placeholder: 'my-project',
      condition: { field: 'operation', value: 'sentry_list_issues' },
    },
    {
      id: 'query',
      title: 'Query',
      type: 'short-input',
      layout: 'full',
      placeholder: 'is:unresolved level:error',
      condition: { field: 'operation', value: 'sentry_list_issues' },
    },
    {
      id: 'issueId',
      title: 'Issue ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '12345',
      condition: { field: 'operation', value: ['sentry_get_issue', 'sentry_update_issue'] },
    },
    {
      id: 'status',
      title: 'Status',
      type: 'short-input',
      layout: 'half',
      placeholder: 'resolved, unresolved, ignored',
      condition: { field: 'operation', value: 'sentry_update_issue' },
    },
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '25',
      condition: { field: 'operation', value: 'sentry_list_projects' },
    },
    {
      id: 'apiKey',
      title: 'Sentry Auth Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Sentry auth token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'sentry_list_projects',
      'sentry_list_issues',
      'sentry_get_issue',
      'sentry_update_issue',
    ],
    config: {
      tool: (params) => params.operation || 'sentry_list_projects',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Sentry API authentication token' },
    organizationSlug: { type: 'string', description: 'Organization slug' },
    projectSlug: { type: 'string', description: 'Project slug' },
    query: { type: 'string', description: 'Issue search query' },
    issueId: { type: 'string', description: 'Issue ID' },
    status: { type: 'string', description: 'New issue status' },
    limit: { type: 'number', description: 'Result limit' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Sentry' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
