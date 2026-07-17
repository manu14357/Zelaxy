import type {
  JiraSmAddCustomerParams,
  JiraSmAddCustomerResponse,
} from '@/tools/jira_service_management/types'
import { getJsmApiBaseUrl, getJsmHeaders } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

const parseAccountIds = (accountIds: string): string[] =>
  accountIds
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id)

export const jiraServiceManagementAddCustomerTool: ToolConfig<
  JiraSmAddCustomerParams,
  JiraSmAddCustomerResponse
> = {
  id: 'jira_service_management_add_customer',
  name: 'Jira Service Management Add Customer',
  description: 'Add customers to a service desk in Jira Service Management',
  version: '1.0.0',

  oauth: {
    required: true,
    provider: 'jira',
  },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'OAuth access token for Jira Service Management',
    },
    cloudId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Jira Cloud ID for the instance',
    },
    serviceDeskId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Service Desk ID (e.g., "1", "2")',
    },
    accountIds: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Comma-separated Atlassian account IDs to add as customers',
    },
  },

  request: {
    url: (params) =>
      `${getJsmApiBaseUrl(params.cloudId)}/servicedesk/${encodeURIComponent(params.serviceDeskId)}/customer`,
    method: 'POST',
    headers: (params) => getJsmHeaders(params.accessToken),
    body: (params) => ({ accountIds: parseAccountIds(params.accountIds) }),
  },

  // Atlassian returns 204 No Content here, so the body is never parsed.
  transformResponse: async (_response, params) => ({
    success: true,
    output: {
      ts: new Date().toISOString(),
      serviceDeskId: params?.serviceDeskId ?? '',
      success: true,
    },
  }),

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    serviceDeskId: { type: 'string', description: 'Service desk ID' },
    success: { type: 'boolean', description: 'Whether customers were added successfully' },
  },
}
