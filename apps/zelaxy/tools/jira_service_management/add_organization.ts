import type {
  JiraSmAddOrganizationParams,
  JiraSmAddOrganizationResponse,
} from '@/tools/jira_service_management/types'
import { getJsmApiBaseUrl, getJsmHeaders } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementAddOrganizationTool: ToolConfig<
  JiraSmAddOrganizationParams,
  JiraSmAddOrganizationResponse
> = {
  id: 'jira_service_management_add_organization',
  name: 'Jira Service Management Add Organization',
  description: 'Add an organization to a service desk in Jira Service Management',
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
    organizationId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Organization ID to add to the service desk',
    },
  },

  request: {
    url: (params) =>
      `${getJsmApiBaseUrl(params.cloudId)}/servicedesk/${encodeURIComponent(params.serviceDeskId)}/organization`,
    method: 'POST',
    headers: (params) => getJsmHeaders(params.accessToken),
    // Atlassian rejects a string organizationId here — it must be sent as a number.
    body: (params) => ({
      organizationId: Number.parseInt(String(params.organizationId).trim(), 10),
    }),
  },

  // Atlassian returns 204 No Content here, so the body is never parsed.
  transformResponse: async (_response, params) => ({
    success: true,
    output: {
      ts: new Date().toISOString(),
      serviceDeskId: params?.serviceDeskId ?? '',
      organizationId: params?.organizationId ?? '',
      success: true,
    },
  }),

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    serviceDeskId: { type: 'string', description: 'Service Desk ID' },
    organizationId: { type: 'string', description: 'Organization ID added' },
    success: { type: 'boolean', description: 'Whether the operation succeeded' },
  },
}
